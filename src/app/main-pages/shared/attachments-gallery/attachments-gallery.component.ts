import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskImage } from '../../shared-data/task.interface';
import { DownloadFileService } from '../../shared-data/download-file.service';
import { ImageViewerStateService } from '../../../shared/services/image-viewer-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attachments-gallery',
  imports: [CommonModule],
  templateUrl: './attachments-gallery.component.html',
  styleUrl: './attachments-gallery.component.scss',
})
export class AttachmentsGalleryComponent {
  /** Emits the image selected for deletion */
  @Output() deleteSingelImage = new EventEmitter<TaskImage>();

  /** List of images displayed in the gallery */
  @Input() imagesForUpload: TaskImage[] = [];

  /** Enables or disables delete functionality for images */
  @Input() deleteIsEnabled: boolean = false;

  /** Enables or disables the download option for images */
  @Input() downloadIsEnabled: boolean = false;

  /** Tracks hover state for image elements */
  isHoveringImage: boolean = false;

  constructor(public downloadFileService: DownloadFileService, public imageViewerStateService: ImageViewerStateService) {}

  /**
   * Emits the selected image to the parent component for deletion
   * @param imageToDelete Image object selected for deletion
   * @param event Click event to stop propagation
   */
  sendImageToDeleteToParent(imageToDelete: TaskImage, event: Event) {
    event.stopPropagation();
    this.deleteSingelImage.emit(imageToDelete);
  }

  /**
   * Sets the images and current index for the image viewer
   * @param index Index of the image to display first
   */
  setImagesToView(index: number) {
    this.imageViewerStateService.imagesToView.set(this.imagesForUpload);
    this.imageViewerStateService.indexCurrentImage.set(index);
  }
}
