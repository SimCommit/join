import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskImage } from '../../shared-data/task.interface';
import { DownloadFileService } from '../../shared-data/download-file.service';

@Component({
  selector: 'app-attachments-gallery',
  imports: [],
  templateUrl: './attachments-gallery.component.html',
  styleUrl: './attachments-gallery.component.scss',
})
export class AttachmentsGalleryComponent {
  @Output() deleteSingelImage = new EventEmitter<TaskImage>();
  @Input() imagesForUpload!: TaskImage[];
  @Input() deleteIsEnabled: boolean = false;
  @Input() downloadIsEnabled: boolean = false;

  isHoveringImage: boolean = false;

  constructor(public downloadFileService: DownloadFileService) {}

  sendImageToDeleteToParent(imageToDelete: TaskImage) {
    this.deleteSingelImage.emit(imageToDelete);
  }
}
