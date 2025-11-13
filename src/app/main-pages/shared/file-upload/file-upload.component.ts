import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TaskDataService } from '../../shared-data/task-data.service';
import { TaskImage } from '../../shared-data/task.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  // #region Properties
  @ViewChild('filepicker') filepickerRef!: ElementRef<HTMLInputElement>;

  @Input() imagesForUpload!: TaskImage[];
  // imagesForUpload: TaskImage[] = [];

  @Output() updatingImages = new EventEmitter<TaskImage[]>();

  errorWrongFormat: boolean = false;
  errorToManyImages: boolean = false;
  isHoveringImage: boolean = false;

  // #endregion

  // constructor(private taskDataService: TaskDataService) {}

  // #region Lifecycle
  async ngAfterViewInit(): Promise<void> {
    await this.initFilepickerListener();
  }
  // #endregion

  // #region Eventlistener
  async initFilepickerListener(): Promise<void> {
    const filepicker = this.filepickerRef.nativeElement;
    filepicker.addEventListener('change', async (): Promise<void> => {
      const files = filepicker.files;
      if (files!.length > 0) {
        Array.from(files!).forEach(async (file): Promise<void> => {
          if (this.thereAreToManyImages()) {
            return;
          }

          if (this.isInvalidImageFormat(file)) {
            return;
          }

          const compressedBase64: string = await this.compressImage(file, 800, 800, 0.7);
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const newName = `${baseName}.webp`;
          this.imagesForUpload.push({ filename: newName, oldFilename: file.name, base64: compressedBase64 });
          this.updatingImages.emit(this.imagesForUpload);

          const byteSize = compressedBase64.length * 0.75;
          console.log(
            'img no:',
            this.imagesForUpload.length,
            'file size in byte: ',
            file.size,
            'compressed byteSize: ',
            byteSize
          );
        });
      }
    });
  }
  // #endregion

  // #region CRUD
  deleteAllImagesFromForm(): void {
    this.imagesForUpload = [];
    this.errorToManyImages = false;
  }

  deleteSingelImage(imageToDelete: TaskImage): void {
    const index = this.imagesForUpload.indexOf(imageToDelete)
    this.imagesForUpload.splice(index, 1);
  }
  // #endregion

  // #region Helpers
  isInvalidImageFormat(file: File): boolean {
    if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp') {
      this.errorWrongFormat = false;
    } else {
      this.errorWrongFormat = true;
    }
    return this.errorWrongFormat;
  }

  thereAreToManyImages(): boolean {
    if (this.imagesForUpload.length > 4) {
      this.errorToManyImages = true;
    } else {
      this.errorToManyImages = false;
    }
    return this.errorToManyImages;
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
