import { Component } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  imports: [],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {

  thereAreUploads: boolean = true;

  images: {"title": string, "URL": string}[] = [
    {"title":"Title Img 1", "URL": ""},
    {"title":"Title Img 2", "URL": ""},
  ];

}
