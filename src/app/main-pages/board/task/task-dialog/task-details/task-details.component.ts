import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, Subtask, TaskImage } from '../../../../shared-data/task.interface';
import { getRandomColor } from '../../../../../shared/color-utils';
import { ContactDataService } from '../../../../shared-data/contact-data.service';
import { AttachmentsGalleryComponent } from '../../../../shared/attachments-gallery/attachments-gallery.component';
import { ToastService } from '../../../../../shared/services/toast.service';

/**
 * Task details component for displaying comprehensive task information
 * Provides read-only view of task data with edit, delete, and subtask toggle capabilities
 */
@Component({
  selector: 'app-task-details',
  imports: [CommonModule, AttachmentsGalleryComponent],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss',
})
export class TaskDetailsComponent {
  /** The task object to display details for */
  @Input() task: Task | null = null;

  /** Event emitter for subtask toggle events */
  @Output() subtaskToggled = new EventEmitter<Subtask>();

  /** Provides access to the toast service for UI messages */
  toastService = inject(ToastService);

  /** Holds the images associated with the current task for display in the attachments gallery */
  images: TaskImage[] = [];

  /**
   * Constructor initializes the task details component
   * @param {ContactDataService} contactDataService - Service for contact data operations
   */
  constructor(public contactDataService: ContactDataService) {}

  /** Lifecycle hook that initializes component data by loading task images */
  ngOnInit(): void {
    this.initImages();
  }

  /** Loads image data from the current task or logs an error if unavailable */
  initImages() {
    if (this.task) {
      this.images = this.task.images;
    } else {
      this.toastService.throwToast({ code: 'image/load/error' });
    }
  }

  /** Reference to color utility function for generating random colors */
  getRandomColor = getRandomColor;


  /**
   * Handles subtask toggle event
   * Emits subtaskToggled event with the modified subtask
   * @param {Subtask} subtask - The subtask that was toggled
   */
  onSubtaskToggle(subtask: Subtask): void {
    this.subtaskToggled.emit(subtask);
  }
}
