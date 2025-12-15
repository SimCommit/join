import { Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { Task, TaskImage } from '../../shared-data/task.interface';
import { CommonModule } from '@angular/common';
import { AttachmentsGalleryComponent } from '../attachments-gallery/attachments-gallery.component';

/**
 * Component for handling image uploads in Add-Task and Edit-Task views.
 * Provides file selection, drag-and-drop, validation, compression and event emission.
 * @component
 */
@Component({
  selector: 'app-file-upload',
  imports: [CommonModule, AttachmentsGalleryComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  // #region Properties / Inputs / Outputs
  /**
   * Maximum allowed file size in bytes for a single uploaded image
   * after compression. Used to validate individual images before
   * adding them to a task.
   */
  readonly MAX_SINGLE_IMAGE_BYTES: number = 400 * 1024;

  /**
   * Maximum allowed combined file size in bytes for all images
   * attached to a single task. Ensures the Firestore document
   * stays below the database size limit.
   */
  readonly MAX_TOTAL_IMAGES_BYTES: number = 810 * 1024;

  /**
   * Maximum number of images that can be attached to a single task.
   * This limit ensures manageable upload sizes and prevents excessive
   * storage consumption in Firestore documents.
   */
  readonly MAX_IMAGES: number = 8;

  /**
   * Reference to the hidden file input element used for selecting images.
   * @type {ElementRef<HTMLInputElement>}
   */
  @ViewChild('filepicker') filepickerRef!: ElementRef<HTMLInputElement>;

  /**
   * Holds all images currently selected or uploaded for the task.
   * Each entry contains filename, size, MIME type and base64 data.
   */
  @Input() imagesForUpload: TaskImage[] = [];

  /** Stores filenames of files that failed format validation */
  @Input() invalidFiles: string[] = [];

  /** Stores filenames of images blocked because they would exceed the total size limit */
  @Input() totalSizeExceededFiles: string[] = [];

  /** Stores filenames of compressed images that still exceed the allowed size */
  @Input() oversizedCompressedImages: string[] = [];

  /** Emits the updated array of images whenever files are added or removed. */
  @Output() updatingImages = new EventEmitter<TaskImage[]>();

  /** Tracks whether the number of selected images exceeds the allowed limit */
  errorTooManyImages: WritableSignal<boolean> = signal(false);
  // #endregion

  // #region Lifecycle
  /**
   * Initializes the filepicker event listener once the view is rendered
   * @returns Resolves when the listener has been set
   */
  async ngAfterViewInit(): Promise<void> {
    await this.initFilepickerListener();
  }
  // #endregion

  // #region Eventlistener
  /**
   * Attaches a change listener to the hidden filepicker input.
   * When files are selected, they are forwarded to the addImages workflow.
   * @returns {Promise<void>}
   */
  async initFilepickerListener(): Promise<void> {
    const filepicker = this.filepickerRef.nativeElement;
    filepicker.addEventListener('change', async (): Promise<void> => {
      const files = filepicker.files;

      if (files) {
        this.addImages(files);
      }
    });
  }
  // #endregion

  // #region Public Actions
  /**
   * Handles images dropped into the dropzone.
   * Extracts files from the DragEvent and forwards them to addImages.
   * @param {DragEvent} event The drop event containing transferred files.
   * @returns {void}
   */
  addImagesByDrop(event: DragEvent): void {
    event.preventDefault();
    const data = event.dataTransfer;

    if (data != null) {
      if (data.files) {
        this.addImages(data.files);
      }
    }
  }

  /**
   * Adds one or multiple selected image files.
   * Validates limits and formats, compresses each file and updates the images array.
   * Emits the updated image list after each successful addition.
   * @param {FileList} files The list of image files selected or dropped.
   * @returns {void}
   */
  addImages(files: FileList): void {
    this.resetWarnings();

    if (!this.wouldExceedImageLimit(files.length)) {
      if (files.length > 0) {
        Array.from(files!).forEach(async (file): Promise<void> => {
          await this.handleFile(file);
        });
      }
      this.errorTooManyImages.set(false);
    } else {
      this.errorTooManyImages.set(true);
    }
  }

  /**
   * Removes all currently stored images from the form.
   * Resets related validation states for maximum-image errors.
   * @returns {void}
   */
  deleteAllImagesFromForm(): void {
    this.imagesForUpload = [];
    this.errorTooManyImages.set(false);
    this.resetWarnings();
    this.updatingImages.emit(this.imagesForUpload);
  }

  /**
   * Deletes a specific image from the current image list.
   * Updates validation related to maximum-image limits.
   * @param {TaskImage} imageToDelete The image object to remove.
   * @returns {void}
   */
  deleteSingelImage(imageToDelete: TaskImage): void {
    const index = this.imagesForUpload.indexOf(imageToDelete);
    this.imagesForUpload.splice(index, 1);
    this.resetWarnings();
    this.updatingImages.emit(this.imagesForUpload);
  }
  // #endregion

  // #region File Handling Workflow
  /**
   * Processes a single image file by validating, compressing and adding it to the upload list.
   * Emits the updated image array after successful processing.
   * @param file The image file to process.
   */
  async handleFile(file: File): Promise<void> {
    if (this.shouldSkipFile(file)) return;

    const compressedBase64 = await this.compressToTargetSize(file);
    const imageObject = this.createTaskImage(file, compressedBase64);

    if (this.imageExceedsSizeLimit(imageObject.size, file.name)) return;

    if (this.noRoomForAnotherImage(imageObject.size, file.name)) return;

    this.imagesForUpload.push(imageObject);
    this.updatingImages.emit(this.imagesForUpload);
  }

  /**
   * Checks whether a given image file should be skipped.
   * Returns true when too many images exist or the file format or size is invalid.
   * @param file The file to validate.
   * @returns True if the file should not be processed.
   */
  shouldSkipFile(file: File): boolean {
    return this.wouldExceedImageLimit() || this.isInvalidImageFormat(file);
  }
  // #endregion

  // #region Validation and Constraints
  /**
   * Validates whether adding additional images would exceed the maximum allowed count.
   * Updates the errorTooManyImages signal based on the validation result.
   * @param additionalCount Number of images to be added (default: 0 for checking current state only)
   * @returns True if the image limit would be exceeded
   */
  wouldExceedImageLimit(additionalCount: number = 0) {
    const totalCount = this.imagesForUpload.length + additionalCount;
    const exceedsLimit = totalCount > this.MAX_IMAGES;
    this.errorTooManyImages.set(exceedsLimit);
    return exceedsLimit;
  }

  /**
   * Checks whether a single compressed image exceeds the allowed
   * maximum file size. If the limit is exceeded, the image name
   * is collected for user feedback.
   * @param newImageBytes Size of the compressed image in bytes
   * @param newImageName File name of the image
   * @returns True if the single-image size limit is exceeded
   */
  imageExceedsSizeLimit(newImageBytes: number, newImageName: string): boolean {
    if (newImageBytes > this.MAX_SINGLE_IMAGE_BYTES) {
      this.oversizedCompressedImages.push(newImageName);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks whether adding another image would exceed the maximum
   * allowed total image size for a task. If the limit would be
   * exceeded, the image name is collected for user feedback.
   * @param newImageBytes Size of the compressed image in bytes
   * @param newImageName File name of the image
   * @returns True if there is no remaining space for another image
   */
  noRoomForAnotherImage(newImageBytes: number, newImageName: string): boolean {
    let currentTotalImageBytes = 0;
    let thereIsNoRoom = true;
    this.imagesForUpload.forEach((img) => (currentTotalImageBytes += img.size));

    if (currentTotalImageBytes + newImageBytes < this.MAX_TOTAL_IMAGES_BYTES) {
      thereIsNoRoom = false;
    } else {
      this.totalSizeExceededFiles.push(newImageName);
      thereIsNoRoom = true;
    }

    return thereIsNoRoom;
  }

  /**
   * Validates whether a file has an allowed image format.
   * Allowed types: JPEG, WEBP.
   * @param {File} file The file to validate.
   * @returns {boolean} True if the format is invalid.
   */
  isInvalidImageFormat(file: File): boolean {
    let errorWrongFormat: boolean = false;

    if (file.type === 'image/jpeg' || file.type === 'image/webp') {
      errorWrongFormat = false;
    } else {
      this.invalidFiles.push(file.name);
      errorWrongFormat = true;
    }
    return errorWrongFormat;
  }

  /**
   * Resets all file-related warning arrays and recalculates the image limit state.
   * Should be called before processing new files to clear previous validation results.
   * @returns void
   */
  resetWarnings() {
    this.invalidFiles = [];
    this.totalSizeExceededFiles = [];
    this.oversizedCompressedImages = [];
    this.wouldExceedImageLimit();
  }
  // #endregion

  // #region Image Model Creation
  /**
   * Creates a TaskImage object from a file and its compressed Base64 string.
   * Extracts metadata such as filename, size and MIME type.
   * @param file The original image file.
   * @param compressedBase64 The Base64 string of the compressed image.
   * @returns A fully constructed TaskImage object.
   */
  createTaskImage(file: File, compressedBase64: string): TaskImage {
    const mimeType = file.type;
    const extension = mimeType.replace(/^image\//, '.');
    const filename = file.name;
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const byteSize = compressedBase64.length * 0.75;

    return {
      filename: filename,
      filenameWithoutType: baseName,
      size: byteSize,
      fileExtension: extension,
      mimeType: mimeType,
      base64: compressedBase64,
    };
  }
  // #endregion

  // #region Image Compression Logic
  /**
   * Compresses an image until a target file size is reached.
   * Performs repeated compression steps with decreasing quality while always using the original file as input.
   * Stops early when the compressed output is below the defined size limit.
   * Returns the final compressed image as a Base64 string.
   * @param file The image file to compress toward the target size.
   * @returns The Base64 string of the compressed image.
   */
  async compressToTargetSize(file: File): Promise<string> {
    let quality: number = 0.95;
    let compressedBase64: string = await this.compressImage(file, 800, 800, quality);
    let currentSize = compressedBase64.length * 0.75;

    for (let i = 0; i < 4; i++) {
      if (currentSize > this.MAX_SINGLE_IMAGE_BYTES) {
        quality -= 0.2;
        compressedBase64 = await this.compressImage(file, 800, 800, quality);
        currentSize = compressedBase64.length * 0.75;
      } else {
        break;
      }
    }

    return compressedBase64;
  }

  /**
   * Compresses an image file and returns a Base64 string.
   * Uses FileReader to load the file and delegates canvas work to helper functions.
   * @param file The image file to be compressed
   * @param maxWidth Maximum width in pixels
   * @param maxHeight Maximum height in pixels
   * @param quality Output quality from 0 to 1
   * @returns A promise that resolves with the compressed Base64 string
   */
  compressImage(file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const compressedBase64 = this.handleCompression(img, file.type, maxWidth, maxHeight, quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject('Failed to load image.');
        const result = event.target?.result as string;
        img.src = result;
      };

      reader.onerror = () => reject('Failed to read file.');
      reader.readAsDataURL(file);
    });
  }
  // #endregion

  // #region Canvas Helpers
  /**
   * Creates a canvas, adjusts its size, draws the image and generates a compressed Base64 output.
   * @param img The loaded image element
   * @param maxWidth Maximum allowed width
   * @param maxHeight Maximum allowed height
   * @param quality Output quality from 0 to 1
   * @returns The compressed image as a Base64 string
   */
  handleCompression(img: HTMLImageElement, mimeType: string, maxWidth: number, maxHeight: number, quality: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const dimensions: { width: number; height: number } = this.setCanvasSize(canvas, img, maxWidth, maxHeight);
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
    const compressedBase64 = canvas.toDataURL(mimeType, quality);
    return compressedBase64;
  }

  /**
   * Calculates and applies the correct canvas size for an image while keeping aspect ratio.
   * @param canvas The canvas element to adjust
   * @param img The image used for size calculation
   * @param maxWidth Maximum allowed width
   * @param maxHeight Maximum allowed height
   * @returns An object containing the final width and height
   */
  setCanvasSize(canvas: HTMLCanvasElement, img: HTMLImageElement, maxWidth: number, maxHeight: number) {
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      if (width > height) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      } else {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;
    return { width: width, height: height };
  }
  // #endregion
}
