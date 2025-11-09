import { Component, ElementRef, ViewChild } from '@angular/core';

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

  thereAreUploads: boolean = true;

  images: { title: string; URL: string }[] = [
    { title: 'Title Img 1', URL: '' },
  ];
  // #endregion

  constructor() {}

  // #region Lifecycle
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

          // const img = document.createElement("img");
          // img.src = URL.createObjectURL(blob);

          const url = URL.createObjectURL(blob);
          this.images.push({title:"Test", URL: url})          
        })
      }
    });
  }
  // #endregion
}
