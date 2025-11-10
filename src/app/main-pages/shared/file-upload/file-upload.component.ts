import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TaskDataService } from '../../shared-data/task-data.service';
import { TaskImage } from '../../shared-data/task.interface';

@Component({
  selector: 'app-file-upload',
  imports: [],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  // #region Properties
  @ViewChild('filepicker') filepickerRef!: ElementRef<HTMLInputElement>;
  // @ViewChild('previewGallery') previewGalleryRef!: ElementRef<HTMLInputElement>;

  // @Input() uploadImages!: TaskImage[];
  uploadImages: TaskImage[] = [];

  @Output() updatingImages = new EventEmitter<TaskImage[]>();

  thereAreUploads: boolean = true;
  // #endregion

  constructor(private taskDataService: TaskDataService) {}

  // #region Lifecycle
  // ngOnInit(): void {
  //   this.uploadImages = this.taskDataService.task
  // }

  async ngAfterViewInit(): Promise<void> {
    await this.initFilepickerListener();
  }
  // #endregion

  // #region Eventlistener
  async initFilepickerListener() {
    const filepicker = this.filepickerRef.nativeElement;
    filepicker.addEventListener('change', async () => {
      const files = filepicker.files;
      if (files!.length > 0) {
        Array.from(files!).forEach(async (file) => {
          const blob = new Blob([file], { type: file.type });
          console.log('neue Datei: ', blob);

          const base64: string = await this.blobToBase64(blob);
          this.uploadImages.push({ filename: file.name, fileType: blob.type, base64: base64 });
        });
        setTimeout(() => {
          this.updatingImages.emit(this.uploadImages);
        }, 1000);
      }
    });
  }

  // saveImage() {
  //   this.taskDataService.
  // }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader: FileReader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };

      reader.readAsDataURL(blob);
    });
  }
  // #endregion
}
