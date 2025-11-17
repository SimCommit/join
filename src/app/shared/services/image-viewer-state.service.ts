import { Injectable, signal, WritableSignal } from '@angular/core';
import { TaskImage } from '../../main-pages/shared-data/task.interface';

@Injectable({
  providedIn: 'root',
})
export class ImageViewerStateService {
  imageViewerIsActive: WritableSignal<boolean> = signal(false);
  imagesToView: WritableSignal<TaskImage[]> = signal([]);  
  indexCurrentImage: WritableSignal<number> = signal(0);  

  constructor() {}

  
}
