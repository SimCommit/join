import { Injectable, signal, WritableSignal } from '@angular/core';
import { TaskImage } from '../../main-pages/shared-data/task.interface';

/**
 * @service ImageViewerStateService
 * Holds the shared state for the image viewer overlay.
 * Stores visibility, images to display, and the current image index.
 */
@Injectable({
  providedIn: 'root',
})
export class ImageViewerStateService {
  /**
   * Indicates whether the image viewer overlay is active.
   * @type {WritableSignal<boolean>}
   */
  imageViewerIsActive: WritableSignal<boolean> = signal(false);

  /**
   * List of images currently available for viewing.
   * @type {WritableSignal<TaskImage[]>}
   */
  imagesToView: WritableSignal<TaskImage[]> = signal([]);

  /**
   * Index of the currently selected image inside the viewer.
   * @type {WritableSignal<number>}
   */
  indexCurrentImage: WritableSignal<number> = signal(0);

  constructor() {}
}
