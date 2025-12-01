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
  // #region Properties
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

  /** Stores filenames of compressed images that still exceed the allowed size */
  @Input() oversizedCompressedImages: string[] = [];

  /** Stores filenames of images that exceed the raw file size limit before compression */
  @Input() oversizedImages: string[] = [];

  /** Emits the updated array of images whenever files are added or removed. */
  @Output() updatingImages = new EventEmitter<TaskImage[]>();

  /** Tracks whether the number of selected images exceeds the allowed limit */
  errorToManyImages: WritableSignal<boolean> = signal(false);

  /** Holds the current number of images for validation checks */
  lenghtOfImagesToValidate: number = 0;
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

  // #region CRUD

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
    this.lenghtOfImagesToValidate = files.length;
    this.resetWarnings();
    if (files.length + this.imagesForUpload.length < 6) {
      if (files.length > 0) {
        Array.from(files!).forEach(async (file): Promise<void> => {
          await this.handleFile(file);
        });
      }
      this.errorToManyImages.set(false);
    } else {
      this.errorToManyImages.set(true);
    }
  }

  /**
   * Processes a single image file by validating, compressing and adding it to the upload list.
   * Emits the updated image array after successful processing.
   * @param file The image file to process.
   */
  async handleFile(file: File): Promise<void> {
    if (this.shouldSkipImage(file)) return;

    const compressedBase64: string = await this.compressImage(file, 800, 800, 0.9);
    const imageObject = this.createTaskImage(file, compressedBase64);

    if (this.isOversizedCompressedImage(file.name, imageObject.size)) return;

    this.imagesForUpload.push(imageObject);
    this.updatingImages.emit(this.imagesForUpload);
  }

  /**
   * Checks whether a given image file should be skipped.
   * Returns true when too many images exist or the file format or size is invalid.
   * @param file The file to validate.
   * @returns True if the file should not be processed.
   */
  shouldSkipImage(file: File): boolean {
    return this.thereAreToManyFiles() || this.isInvalidImageFormat(file) || this.isOversizedImage(file);
  }

  /**
   * Creates a TaskImage object from a file and its compressed Base64 string.
   * Extracts metadata such as filename, size and MIME type.
   * @param file The original image file.
   * @param compressedBase64 The Base64 string of the compressed image.
   * @returns A fully constructed TaskImage object.
   */
  createTaskImage(file: File, compressedBase64: string): TaskImage {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const extension = '.webp';
    const newName = `${baseName}.webp`;
    const byteSize = compressedBase64.length * 0.75;

    return {
      filename: newName,
      filenameWithoutType: baseName,
      size: byteSize,
      fileExtension: extension,
      mimeType: 'image/webp',
      base64: compressedBase64,
    };
  }

  /**
   * Removes all currently stored images from the form.
   * Resets related validation states for maximum-image errors.
   * @returns {void}
   */
  deleteAllImagesFromForm(): void {
    this.imagesForUpload = [];
    this.errorToManyImages.set(false);
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

  // #region Helpers
  /**
   * Checks whether more than five images are stored.
   * Updates the errorToManyImages signal based on the result.
   * @returns {boolean} True if the limit is exceeded.
   */
  thereAreToManyFiles(): boolean {
    if (this.imagesForUpload.length > 4) {
      this.errorToManyImages.set(true);
    } else {
      this.errorToManyImages.set(false);
    }
    return this.errorToManyImages();
  }

  /**
   * Validates whether a file has an allowed image format.
   * Allowed types: PNG, JPEG, WEBP.
   * Updates errorWrongFormat accordingly.
   * @param {File} file The file to validate.
   * @returns {boolean} True if the format is invalid.
   */
  isInvalidImageFormat(file: File): boolean {
    let errorWrongFormat: boolean = false;
    if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp') {
      errorWrongFormat = false;
    } else {
      this.invalidFiles.push(file.name);
      errorWrongFormat = true;
    }
    return errorWrongFormat;
  }

  /**
   * Checks if the raw file exceeds the allowed size limit before compression.
   * Adds the filename to oversizedImages when too large.
   * @param file The file to check.
   * @returns True when the file exceeds the maximum size.
   */
  isOversizedImage(file: File) {
    let oversized: boolean;

    if (file.size > 20 * 1024 * 1024) {
      oversized = true;
      this.oversizedImages.push(file.name);
    } else {
      oversized = false;
    }

    return oversized;
  }

  /**
   * Checks whether a compressed image still exceeds the allowed size limit.
   * Pushes the filename into oversizedCompressedImages when too large.
   * @param name Original filename of the compressed image.
   * @param size Size of the compressed file in bytes.
   * @returns True when the compressed image is above the limit.
   */
  isOversizedCompressedImage(name: string, size: number): boolean {
    let isOversized: boolean;

    if (size > 160 * 1024) {
      isOversized = true;
      this.oversizedCompressedImages.push(name);
    } else {
      isOversized = false;
    }

    return isOversized;
  }

  /**
   * Resets all file-related warning arrays and recalculates the too-many-files state.
   * @returns void
   */
  resetWarnings() {
    this.invalidFiles = [];
    this.oversizedCompressedImages = [];
    this.oversizedImages = [];
    this.thereAreToManyFiles();
  }

  /**
   * Compresses an image file to a target size or quality.
   * Maintains aspect ratio and outputs the result as a Base64-encoded string.
   *
   * @param file The image file to be compressed.
   * @param maxWidth The maximum width of the image in pixels. Default is 800.
   * @param maxHeight The maximum height of the image in pixels. Default is 800.
   * @param quality The quality of the output image, from 0 (lowest) to 1 (highest). Default is 0.8.
   * @returns A promise that resolves with the Base64 string of the compressed image.
   */
  compressImage(file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
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
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/webp', quality);
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
}
