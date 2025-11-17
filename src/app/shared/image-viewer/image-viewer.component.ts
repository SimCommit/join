import { Component } from '@angular/core';
import { ImageViewerStateService } from '../services/image-viewer-state.service';
import { TaskImage } from '../../main-pages/shared-data/task.interface';

@Component({
  selector: 'app-image-viewer',
  imports: [],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
})
export class ImageViewerComponent {
  imagesToView: TaskImage[] = [];

  constructor(public imageViewerStateService: ImageViewerStateService) {
  }

  ngOnInit(): void {
    this.imagesToView = this.imageViewerStateService.imagesToView();
  }

}
