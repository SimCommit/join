import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskImage } from '../../shared-data/task.interface';

@Component({
  selector: 'app-attachments-gallery',
  imports: [],
  templateUrl: './attachments-gallery.component.html',
  styleUrl: './attachments-gallery.component.scss',
})
export class AttachmentsGalleryComponent {
  @Output() deleteSingelImage = new EventEmitter<TaskImage>();

  @Input() imagesForUpload!: TaskImage[];

  isHoveringImage: boolean = false;

  sendImageToDeleteToParent(imageToDelete: TaskImage) {
    this.deleteSingelImage.emit(imageToDelete);
  }
}
