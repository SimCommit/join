import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskImage } from '../../shared-data/task.interface';
import { DownloadFileService } from '../../shared-data/download-file.service';
import { ImageViewerStateService } from '../../../shared/services/image-viewer-state.service';

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

  constructor(public downloadFileService: DownloadFileService, public imageViewerStateService: ImageViewerStateService) {}

  sendImageToDeleteToParent(imageToDelete: TaskImage, event: Event) {
    event.stopPropagation();
    this.deleteSingelImage.emit(imageToDelete);
  }

  setImagesToView(index: number) {
    this.imageViewerStateService.imagesToView.set(this.imagesForUpload);
    this.imageViewerStateService.indexCurrentImage.set(index);
  }
}
