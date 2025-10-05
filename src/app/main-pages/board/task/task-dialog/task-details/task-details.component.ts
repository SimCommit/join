import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, Subtask } from '../../../../shared-data/task.interface';
import { getRandomColor, getInitials } from '../../../../../shared/color-utils';
import { ContactDataService } from '../../../../shared-data/contact-data.service';

/**
 * Task details component for displaying comprehensive task information
 * Provides read-only view of task data with edit, delete, and subtask toggle capabilities
 */
@Component({
  selector: 'app-task-details',
  imports: [CommonModule],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss',
})
export class TaskDetailsComponent {
  /**
   * The task object to display details for
   */
  @Input() task: Task | null = null;

  /**
   * Event emitter for edit button clicks
   */
  @Output() editClicked = new EventEmitter<void>();

  /**
   * Event emitter for delete button clicks, emits task ID
   */
  @Output() deleteClicked = new EventEmitter<string>();

  /**
   * Event emitter for subtask toggle events
   */
  @Output() subtaskToggled = new EventEmitter<Subtask>();

    /**
     * Constructor initializes the task details component
     * @param {ContactDataService} contactDataService - Service for contact data operations
     */
    constructor(public contactDataService: ContactDataService) {}

  /**
   * Reference to color utility function for generating random colors
   */
  getRandomColor = getRandomColor;

  // /**
  //  * Reference to utility function for extracting user initials
  //  */
  // getInitials = getInitials;

  /**
   * Handles edit button click event
   * Emits editClicked event to parent component
   */
  onEditClick(): void {
    this.editClicked.emit();
  }

  /**
   * Handles delete button click event
   * Emits deleteClicked event with task ID if task exists
   */
  onDeleteClick(): void {
    if (this.task?.id) {
      this.deleteClicked.emit(this.task.id);
    }
  }

  /**
   * Handles subtask toggle event
   * Emits subtaskToggled event with the modified subtask
   * @param {Subtask} subtask - The subtask that was toggled
   */
  onSubtaskToggle(subtask: Subtask): void {
    this.subtaskToggled.emit(subtask);
  }
}
