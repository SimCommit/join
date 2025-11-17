import { Component } from '@angular/core';
import { ImageViewerStateService } from '../services/image-viewer-state.service';
import { TaskImage } from '../../main-pages/shared-data/task.interface';
import { DownloadFileService } from '../../main-pages/shared-data/download-file.service';

@Component({
  selector: 'app-image-viewer',
  imports: [],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
})
export class ImageViewerComponent {
  imagesToView: TaskImage[] = [];
  index: number = 0;

  constructor(
    public imageViewerStateService: ImageViewerStateService,
    public downloadFileService: DownloadFileService
  ) {}

  ngOnInit(): void {
    this.imagesToView = this.imageViewerStateService.imagesToView();
    this.index = this.imageViewerStateService.indexCurrentImage();
  }

  calcByteIntoKiloByte(size: number): string {
    let kb:string = (size / 1000).toFixed(2);
    return kb;
  }

  perviousImage(i: number): void {
    if (i > 0) {
      this.imageViewerStateService.indexCurrentImage.set(i - 1);
    } else {
      this.imageViewerStateService.indexCurrentImage.set(this.imagesToView.length - 1);
    }
  }

  nextImage(i: number) {
    if (i < this.imagesToView.length - 1) {
      this.imageViewerStateService.indexCurrentImage.set(i + 1);
    } else {
      this.imageViewerStateService.indexCurrentImage.set(0);
    }
  }
}
