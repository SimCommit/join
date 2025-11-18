import { Component, ElementRef, ViewChild } from '@angular/core';
import { ImageViewerStateService } from '../services/image-viewer-state.service';
import { TaskImage } from '../../main-pages/shared-data/task.interface';
import { DownloadFileService } from '../../main-pages/shared-data/download-file.service';

/**
 * @component ImageViewerComponent
 * Displays images inside an overlay viewer.
 * Supports navigation, file download, and basic image meta information.
 */
@Component({
  selector: 'app-image-viewer',
  imports: [],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
})
export class ImageViewerComponent {
  /**
   * List of images currently available for viewing.
   * @type {TaskImage[]}
   */
  imagesToView: TaskImage[] = [];

  @ViewChild ("downloadButton") downloadButton!: ElementRef<HTMLButtonElement>;

  /**
   * @constructor
   * @param {ImageViewerStateService} imageViewerStateService Service managing viewer state and image index.
   * @param {DownloadFileService} downloadFileService Service handling file downloads.
   */
  constructor(
    public imageViewerStateService: ImageViewerStateService,
    public downloadFileService: DownloadFileService
  ) {}

  /**
   * Initializes images and the current index from the state service.
   * @returns {void}
   */
  ngOnInit(): void {
    this.imagesToView = this.imageViewerStateService.imagesToView();
  }

  ngAfterViewInit(): void {
    this.downloadButton.nativeElement.focus();
  }

  /**
   * Converts a size in bytes to a string representing kilobytes with two decimal places.
   * @param {number} size File size in bytes.
   * @returns {string} Kilobyte size formatted with two decimals.
   */
  calcByteIntoKiloByte(size: number): string {
    let kb: string = (size / 1000).toFixed(2);
    return kb;
  }

  /**
   * Navigates to the previous image. Wraps to the last image if index is 0.
   * @param {number} i Current image index.
   * @returns {void}
   */
  perviousImage(i: number): void {
    if (i > 0) {
      this.imageViewerStateService.indexCurrentImage.set(i - 1);
    } else {
      this.imageViewerStateService.indexCurrentImage.set(this.imagesToView.length - 1);
    }
  }

  /**
   * Navigates to the next image. Wraps to the first image if at the end.
   * @param {number} i Current image index.
   * @returns {void}
   */
  nextImage(i: number) {
    if (i < this.imagesToView.length - 1) {
      this.imageViewerStateService.indexCurrentImage.set(i + 1);
    } else {
      this.imageViewerStateService.indexCurrentImage.set(0);
    }
  }
}
