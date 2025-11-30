import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import { TaskImage } from '../../shared-data/task.interface';
import { DownloadFileService } from '../../shared-data/download-file.service';
import { ImageViewerStateService } from '../../../shared/services/image-viewer-state.service';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';

@Component({
  selector: 'app-attachments-gallery',
  imports: [],
  templateUrl: './attachments-gallery.component.html',
  styleUrl: './attachments-gallery.component.scss',
})
export class AttachmentsGalleryComponent {
  @Output() deleteSingelImage = new EventEmitter<TaskImage>();
  @Input() imagesForUpload: TaskImage[] = [];
  @Input() deleteIsEnabled: boolean = false;
  @Input() downloadIsEnabled: boolean = false;

  isHoveringImage: boolean = false;

  private _focusMonitor = inject(FocusMonitor);
  private _cdr = inject(ChangeDetectorRef);
  private _ngZone = inject(NgZone);

  @ViewChild('element') element!: ElementRef<HTMLElement>;

  elementOrigin = this.formatOrigin(null);

  constructor(
    public downloadFileService: DownloadFileService,
    public imageViewerStateService: ImageViewerStateService
  ) {}

  ngAfterViewInit(): void {
    this._focusMonitor.monitor(this.element).subscribe((origin) =>
      this._ngZone.run(() => {
        this.elementOrigin = this.formatOrigin(origin);
        this._cdr.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this.element);
  }

  // Hier Funkltion überlegen um Monitor zu testen
  formatOrigin(origin: FocusOrigin): string {
    return origin ? origin + ' focused' : 'blurred';
  }

  sendImageToDeleteToParent(imageToDelete: TaskImage, event: Event) {
    event.stopPropagation();
    this.deleteSingelImage.emit(imageToDelete);
  }

  setImagesToView(index: number) {
    this.imageViewerStateService.imagesToView.set(this.imagesForUpload);
    this.imageViewerStateService.indexCurrentImage.set(index);
  }
}
