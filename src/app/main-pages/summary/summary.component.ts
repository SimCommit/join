import { Component, inject } from '@angular/core';
import { TaskDataService } from '../shared-data/task-data.service';
import { Observable } from 'rxjs';
import { BoardColumn } from '../shared-data/task.interface';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BreakpointService } from '../../shared/services/breakpoint.service';
import { AuthenticationService } from '../../auth/services/authentication.service';

/**
 * Component that displays a summary dashboard of tasks and user information.
 * Shows task statistics, next deadline, and a personalized greeting.
 *
 * @class SummaryComponent
 */
@Component({
  selector: 'app-summary',
  imports: [CommonModule, RouterLink],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  // #region Properties
  /**
   * Observable stream of board columns with their associated tasks.
   * Used in the template to display summary data reactively.
   */
  columns$!: Observable<BoardColumn[]>;
  // #endregion

  /**
   * Initializes the SummaryComponent and injects required services.
   *
   * @param taskDataService Provides access to tasks and board column data.
   * @param breakpointService Detects viewport size for responsive behavior.
   * @param authenticationService Provides information about the current user.
   */
  constructor(public taskDataService: TaskDataService, public breakpointService: BreakpointService, private authenticationService: AuthenticationService) {}

  // #region Lifecycle
  /**
   * Lifecycle hook that initializes the columns observable.
   * Called once after the component has been initialized.
   */
  ngOnInit(): void {
    this.columns$ = this.taskDataService.getBoardColumns();
  }
  // #endregion

  // #region Public Methods
  /**
   * Returns the formatted date of the next upcoming urgent task deadline.
   * Only considers tasks that are marked as 'urgent' and not completed.
   *
   * @param columns Array of board columns containing tasks.
   * @returns A formatted date string (e.g., "July 21, 2025") or '---' if no such task exists.
   */
  getNextDeadline(columns: BoardColumn[]): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: '2-digit' };

    const urgentTasksWithDueDate = columns
      .flatMap((col) => col.tasks)
      .filter((task) => task.priority === 'urgent' && task.status !== 'done')
      .filter((task) => task.dueDate !== undefined)
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());

    if (urgentTasksWithDueDate.length > 0) {
      return urgentTasksWithDueDate[0].dueDate!.toLocaleDateString('en-US', options);
    } else {
      return '---';
    }
  }

  /**
   * Counts all tasks across all board columns that are marked as 'urgent' and not completed.
   *
   * @param columns Array of board columns containing tasks.
   * @returns The number of open urgent tasks.
   */
  countUrgentOpenTasks(columns: BoardColumn[]): number {
    return columns.flatMap((col) => col.tasks).filter((task) => task.priority === 'urgent' && task.status !== 'done').length;
  }

  /**
   * Counts tasks across all board columns by status.
   * If status is 'incomplete', all tasks except 'done' are counted.
   *
   * @param columns Board columns with tasks.
   * @param status Status to count.
   * @returns Number of matching tasks.
   */
  countOpenTaskWithStatus(columns: BoardColumn[], status: string): number {
    if (status === 'incomplete') {
      return columns.flatMap((col) => col.tasks).filter((task) => task.status !== 'done').length;
    } else {
      return columns.flatMap((col) => col.tasks).filter((task) => task.status === status).length;
    }
  }

  /**
   * Counts all tasks across the entire board regardless of status.
   * All task arrays from each column are flattened into a single array
   * to ensure every task is included in the count.
   *
   * @param columns Board columns containing task arrays.
   * @returns Total number of tasks in the board.
   */
  countAllTasksInBoard(columns: BoardColumn[]): number {
    const count = columns.flatMap((col) => col.tasks).length;
    return count;
  }

  /**
   * Generates a greeting message based on the current time of day.
   * Optionally appends a comma if the user has an email address (i.e., is signed in).
   *
   * @returns A greeting like 'Good morning,' or 'Good evening'.
   */
  getGreetingMessage(): string {
    const now: Date = new Date();
    const hours: number = Number(String(now.getHours()).padStart(2, '0'));
    const commaOrEmpty: string = this.authenticationService.currentUser?.email ? ',' : '';

    if (hours <= 5) {
      return 'Good night' + commaOrEmpty;
    } else if (hours <= 12) {
      return 'Good morning' + commaOrEmpty;
    } else if (hours <= 18) {
      return 'Good afternoon' + commaOrEmpty;
    } else {
      return 'Good evening' + commaOrEmpty;
    }
  }

  /**
   * Retrieves the display name of the currently signed-in user.
   *
   * @returns The user's display name, or an empty string if not available.
   */
  getUserName(): string {
    if (!this.authenticationService.currentUser) return '';
    const userName: string = this.authenticationService.currentUser.displayName ?? '';
    return userName;
  }
  // #endregion

  // #region Helpers
  /**
   * Truncates a name to a maximum of 40 characters, appending an ellipsis if necessary.
   *
   * @param name The name string to truncate.
   * @returns The truncated name, with '...' appended if it exceeds 40 characters.
   */
  truncateName(name: string): string {
    if (name.length >= 40) {
      return name.slice(0, 40) + '...';
    }

    return name;
  }
  // #endregion
}
