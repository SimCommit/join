import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImageViewerStateService {
  imageViewerIsActive: WritableSignal<boolean> = signal(false);

  constructor() {}
}
