import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskEditFormComponent } from './task-edit-form/task-edit-form.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { Task, Subtask } from '../../../shared-data/task.interface';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * Component that displays a dialog with task details and editing options.
 * Provides outputs for editing, saving, deleting and closing the dialog,
 * as well as handling subtask interactions.
 */
@Component({
  selector: 'app-task-dialog',
  imports: [CommonModule, TaskEditFormComponent, TaskDetailsComponent, A11yModule],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss',
})
export class TaskDialogComponent {
  /**
   * The task data to display or edit.
   */
  @Input() task: Task | null = null;

  /**
   * Whether the component is in edit mode.
   */
  @Input() isEditMode = false;

  /**
   * Reference to the task edit form component.
   */
  @ViewChild(TaskEditFormComponent) taskEditForm!: TaskEditFormComponent;

  /**
   * Emits when the dialog is requested to be closed.
   */
  @Output() closeClicked = new EventEmitter<void>();

  @Output() cancelClicked = new EventEmitter<Task>();

  /**
   * Emits when the edit button is clicked.
   */
  @Output() editClicked = new EventEmitter<void>();

  /**
   * Emits the task ID when the delete button is clicked.
   */
  @Output() deleteClicked = new EventEmitter<string>();

  /**
   * Emits the updated task when the save button is clicked.
   */
  @Output() saveClicked = new EventEmitter<Task>();

  /**
   * Emits the toggled subtask.
   */
  @Output() subtaskToggled = new EventEmitter<Subtask>();

  taskEditFormIsValid: boolean = true;

  checkValidationState(state: boolean): void {
    this.taskEditFormIsValid = state;
  }

  /**
   * Emits the closeClicked event to close the dialog.
   */
  closeDialog(): void {
    this.closeClicked.emit();
  }

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
   * Emits the saveClicked event with the updated task.
   *
   * @param task - The task to save.
   */
  onSaveClicked(task: Task): void {
    this.saveClicked.emit(task);
  }

  /**
   * Emits the cancelClicked if task event exists when canceling
   * closeClicked otherwise.
   */
  onCancelClicked(): void {
    if (this.task) {
      this.cancelClicked.emit();
    } else {
      this.closeClicked.emit();
    }
  }

  /**
   * Emits the subtaskToggled event with the toggled subtask.
   *
   * @param subtask - The subtask that was toggled.
   */
  onSubtaskToggled(subtask: Subtask): void {
    this.subtaskToggled.emit(subtask);
  }

  /**
   * Triggers the save action on the task edit form.
   */
  onSaveButtonClicked(): void {
    if (this.taskEditForm) {
      this.taskEditForm.onSaveClick();
    }
  }
}
