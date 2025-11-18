import { Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { TaskImage } from '../../shared-data/task.interface';
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
   * @type {TaskImage[]}
   */
  @Input() imagesForUpload: TaskImage[] = [];

  /**
   * Emits the updated array of images whenever files are added or removed.
   * @type {EventEmitter<TaskImage[]>}
   */
  @Output() updatingImages = new EventEmitter<TaskImage[]>();

  /**
   * Indicates whether the last selected file had an invalid format.
   * Used to show validation messages in the UI.
   * @type {boolean}
   */
  errorWrongFormat: boolean = false;

  /**
   * Signals whether too many images have been selected.
   * True when more than five images exist.
   * @type {WritableSignal<boolean>}
   */
  errorToManyImages: WritableSignal<boolean> = signal(false);
  // #endregion

  // #region Lifecycle

  /**
   * Initializes the component after the view is fully rendered.
   * Sets up the filepicker change listener.
   * @returns {Promise<void>}
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
    if (files.length + this.imagesForUpload.length < 6) {
      if (files.length > 0) {
        Array.from(files!).forEach(async (file): Promise<void> => {
          if (this.thereAreToManyImages()) return;

          if (this.isInvalidImageFormat(file)) return;

          const compressedBase64: string = await this.compressImage(file, 800, 800, 0.9);
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const newName = `${baseName}.webp`;
          const byteSize = compressedBase64.length * 0.75;

          this.imagesForUpload.push({
            filename: newName,
            oldFilename: file.name,
            size: byteSize,
            mimeType: 'image/webp',
            base64: compressedBase64,
          });
          this.updatingImages.emit(this.imagesForUpload);
        });
      }
      this.errorToManyImages.set(false);
    } else {
      this.errorToManyImages.set(true);
    }
  }

  /**
   * Removes all currently stored images from the form.
   * Resets related validation states for maximum-image errors.
   * @returns {void}
   */
  deleteAllImagesFromForm(): void {
    this.imagesForUpload = [];
    this.errorToManyImages.set(false);
    this.thereAreToManyImages();
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
    this.thereAreToManyImages();
  }
  // #endregion

  // #region Helpers

  /**
   * Validates whether a file has an allowed image format.
   * Allowed types: PNG, JPEG, WEBP.
   * Updates errorWrongFormat accordingly.
   * @param {File} file The file to validate.
   * @returns {boolean} True if the format is invalid.
   */
  isInvalidImageFormat(file: File): boolean {
    if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp') {
      this.errorWrongFormat = false;
    } else {
      this.errorWrongFormat = true;
    }
    return this.errorWrongFormat;
  }

  /**
   * Checks whether more than five images are stored.
   * Updates the errorToManyImages signal based on the result.
   * @returns {boolean} True if the limit is exceeded.
   */
  thereAreToManyImages(): boolean {
    if (this.imagesForUpload.length > 4) {
      this.errorToManyImages.set(true);
    } else {
      this.errorToManyImages.set(false);
    }
    return this.errorToManyImages();
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
