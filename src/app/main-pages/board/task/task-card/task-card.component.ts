import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Subtask, Task } from '../../../shared-data/task.interface';
import { CommonModule } from '@angular/common';
import { getRandomColor, getInitials } from '../../../../shared/color-utils';
import { TaskDataService } from '../../../shared-data/task-data.service';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ContactDataService } from '../../../shared-data/contact-data.service';

/**
 * Task card component for displaying task information in board view
 * Handles task display, progress tracking, and user interactions
 */
@Component({
  selector: 'app-task-card',
  imports: [CommonModule, CdkDrag, CdkDragHandle],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  /**
   * The task data to display in the card.
   */
  @Input() task!: Task;

  /**
   * Indicates whether the component is rendered in mobile view.
   */
  @Input() isMobile: boolean = false;

  /**
   * Emits the task when the card is clicked.
   */
  @Output() taskClicked = new EventEmitter<Task>();

  /**
   * Emits a boolean to indicate drag-and-drop behavior.
   */
  @Output() dropIndication = new EventEmitter<boolean>();

  /**
   * Utility function to get a random background color for contact avatars.
   */
  getRandomColor = getRandomColor;

  /**
   * Maximum number of characters before task title/description is truncated.
   */
  private readonly MAX_TEXT_LENGTH = 50;

  /**
   * Character limit to apply text truncation during search highlighting.
   */
  private readonly TRUNCATE_SEARCH_LIMIT = 70;

  /**
   * Constructor that injects the task data service.
   *
   * @param taskDataService - Service used for accessing and managing task data.
   */
  constructor(public taskDataService: TaskDataService, public contactDataService: ContactDataService) {}

  /**
   * Deletes task using its ID
   * @param {string | undefined} taskId - ID of task to delete
   */
  deleteTaskViaCard(taskId: string | undefined): void {
    if (!this.isValidTaskId(taskId)) {
      return;
    }
    this.taskDataService.deleteTask(taskId!);
  }

  /**
   * Validates if task ID is defined
   * @param {string | undefined} taskId - Task ID to validate
   * @returns {boolean} True if task ID is valid
   */
  private isValidTaskId(taskId: string | undefined): boolean {
    return taskId !== undefined;
  }

  /**
   * Counts completed subtasks
   * @param {Subtask[]} subtasks - Array of subtasks
   * @returns {number} Number of completed subtasks
   */
  getNumberOfAllCompletedSubtasks(subtasks: Subtask[]): number {
    return subtasks.reduce((count, subtask) => {
      return count + this.getSubtaskCompletionValue(subtask);
    }, 0);
  }

  /**
   * Returns numeric value for subtask completion
   * @param {Subtask} subtask - Subtask to check
   * @returns {number} 1 if completed, 0 if not
   */
  private getSubtaskCompletionValue(subtask: Subtask): number {
    return subtask.completed ? 1 : 0;
  }

  /**
   * Returns tooltip text showing subtask progress
   * @param {Subtask[]} subtasks - Array of subtasks
   * @returns {string} Progress tooltip text
   */
  getSubtaskProgressTooltip(subtasks: Subtask[]): string {
    const completed = this.getNumberOfAllCompletedSubtasks(subtasks);
    const total = subtasks.length;
    return `${completed} of ${total} Subtasks completed`;
  }

  /**
   * Checks if all subtasks are completed
   * @param {Subtask[]} subtasks - Array of subtasks
   * @returns {boolean} True if all subtasks completed
   */
  isAllSubtasksCompleted(subtasks: Subtask[]): boolean {
    const completed = this.getNumberOfAllCompletedSubtasks(subtasks);
    return completed === subtasks.length;
  }

  /**
   * Handles task card click event
   */
  onTaskClick(): void {
    this.taskClicked.emit(this.task);
  }

  /**
   * Truncates text to maximum length with proper word boundaries
   * @param {string} text - Text to truncate
   * @returns {string} Truncated text
   */
  truncateText(text: string): string {
    if (!this.shouldTruncateText(text)) {
      return text;
    }
    return this.performTextTruncation(text);
  }

  /**
   * Checks if text should be truncated
   * @param {string} text - Text to check
   * @returns {boolean} True if text should be truncated
   */
  private shouldTruncateText(text: string): boolean {
    return text.length > this.MAX_TEXT_LENGTH;
  }

  /**
   * Performs the actual text truncation
   * @param {string} text - Text to truncate
   * @returns {string} Truncated text with ellipsis
   */
  private performTextTruncation(text: string): string {
    const charAtLimit = text.charAt(this.MAX_TEXT_LENGTH);

    if (this.isCharacterSpace(charAtLimit)) {
      return this.truncateAtSpaceBoundary(text);
    }
    return this.truncateWithWordBoundary(text);
  }

  /**
   * Checks if character is a space
   * @param {string} char - Character to check
   * @returns {boolean} True if character is space
   */
  private isCharacterSpace(char: string): boolean {
    return char === ' ';
  }

  /**
   * Truncates text at space boundary
   * @param {string} text - Text to truncate
   * @returns {string} Truncated text
   */
  private truncateAtSpaceBoundary(text: string): string {
    return text.slice(0, this.MAX_TEXT_LENGTH - 1) + '...';
  }

  /**
   * Truncates text with word boundary consideration
   * @param {string} text - Text to truncate
   * @returns {string} Truncated text
   */
  private truncateWithWordBoundary(text: string): string {
    const spaceIndex = text.indexOf(' ', this.MAX_TEXT_LENGTH);

    if (this.isSpaceWithinSearchLimit(spaceIndex)) {
      return text.slice(0, this.MAX_TEXT_LENGTH) + '...';
    }

    return text.slice(0, this.MAX_TEXT_LENGTH) + '...';
  }

  /**
   * Checks if space is within truncation search limit
   * @param {number} spaceIndex - Index of space character
   * @returns {boolean} True if space is within limit
   */
  private isSpaceWithinSearchLimit(spaceIndex: number): boolean {
    return spaceIndex >= this.MAX_TEXT_LENGTH && spaceIndex <= this.TRUNCATE_SEARCH_LIMIT;
  }
}
