import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskDataService } from '../shared-data/task-data.service';
import { BoardColumn, Task, Subtask, BoardStatus } from '../shared-data/task.interface';
import { TaskCardComponent } from './task/task-card/task-card.component';
import { TaskDialogComponent } from './task/task-dialog/task-dialog.component';
import { CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { TaskCreateFormComponent } from '../shared/task-create-form/task-create-form.component';
import { Router } from '@angular/router';
import { ContactDataService } from '../shared-data/contact-data.service';

/**
 * Board component for managing kanban board with drag-and-drop functionality
 * Handles task display, filtering, and dialog management
 */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskCardComponent, TaskDialogComponent, CdkDropList, TaskCreateFormComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit, OnDestroy {
  /** Stream of all board columns */
  columns$!: Observable<BoardColumn[]>;

  /** Stream of filtered columns based on search */
  filteredColumns$!: Observable<BoardColumn[]>;

  /** Currently selected task */
  selectedTask: Task | null = null;

  /** Controls visibility of task detail dialog */
  showTaskDialog: boolean = false;

  /** Flag to toggle edit mode for tasks */
  isEditMode: boolean = false;

  /** Indicates if a drag operation is in progress */
  isDragging: boolean = false;

  /** Controls visibility of task creation form */
  openAddTask: boolean = false;

  /** Sets status for newly created task */
  setTaskStatus!: BoardStatus;

  /** Search term entered by the user */
  searchTerm: string = '';

  /** Indicates if the search returned results */
  hasSearchResults: boolean = true;

  /** Indicates if the current screen is mobile-sized */
  isMobile: boolean = false;

  /** Emits search terms to filter tasks */
  private searchSubject = new BehaviorSubject<string>('');

  /** Subscription to breakpoint observer for responsive layout */
  private breakpointSubscription?: Subscription;

  /** Reference to the task creation form component */
  @ViewChild(TaskCreateFormComponent) taskCreateForm!: TaskCreateFormComponent;

  /**
   * Initializes the BoardComponent with necessary services for task management,
   * responsive behavior, and routing.
   *
   * @param taskDataService - Service for managing task and board data.
   * @param changeDetectorRef - Angular service to trigger manual change detection.
   * @param breakpointObserver - Service to detect screen size changes for responsive layout.
   * @param router - Angular Router for navigation.
   */
  constructor(
    private taskDataService: TaskDataService,
    private contactDataService: ContactDataService,
    private changeDetectorRef: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {}

  /**
   * Initializes component and sets up data streams
   */
  ngOnInit(): void {
    this.initializeDataStreams();
    this.setupBreakpointObserver();
    this.initContactDataService();
  }

  initContactDataService() {
    this.contactDataService.connectStreams();
  }

  /**
   * Cleans up subscriptions on component destroy
   */
  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  /**
   * Sets up board columns and filtered data streams
   */
  private initializeDataStreams(): void {
    this.columns$ = this.taskDataService.getBoardColumns();
    this.filteredColumns$ = combineLatest([this.columns$, this.searchSubject.asObservable()]).pipe(
      map(([columns, searchTerm]) => this.filterTasksBySearchTerm(columns, searchTerm))
    );
  }

  /**
   * Sets up responsive breakpoint monitoring
   */
  private setupBreakpointObserver(): void {
    this.breakpointSubscription = this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .subscribe((state: BreakpointState) => {
        this.isMobile = state.matches;
      });
  }

  /**
   * Cleans up component subscriptions
   */
  private cleanupSubscriptions(): void {
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
  }

  /**
   * Handles drag and drop task movement between columns
   * @param {CdkDragDrop<Task[]>} event - Drag drop event
   */
  drop(event: CdkDragDrop<Task[]>): void {
    if (this.isTaskMovedWithinSameColumn(event)) {
      this.reorderTasksInColumn(event);
    } else {
      this.moveTaskBetweenColumns(event);
    }
  }

  /**
   * Checks if task was moved within the same column
   * @param {CdkDragDrop<Task[]>} event - Drag drop event
   * @returns {boolean} True if moved within same column
   */
  private isTaskMovedWithinSameColumn(event: CdkDragDrop<Task[]>): boolean {
    return event.previousContainer === event.container;
  }

  /**
   * Reorders tasks within the same column
   * @param {CdkDragDrop<Task[]>} event - Drag drop event
   */
  private reorderTasksInColumn(event: CdkDragDrop<Task[]>): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  }

  /**
   * Moves task between different columns and updates status
   * @param {CdkDragDrop<Task[]>} event - Drag drop event
   */
  private moveTaskBetweenColumns(event: CdkDragDrop<Task[]>): void {
    const movedTask = event.previousContainer.data[event.previousIndex];

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    if (movedTask.id) {
      this.updateTaskStatus(movedTask, event.container.id as BoardStatus);
    }
  }

  /**
   * Updates task status in database
   * @param {Task} task - Task to update
   * @param {BoardStatus} newStatus - New status for the task
   */
  private updateTaskStatus(task: Task, newStatus: BoardStatus): void {
    task.status = newStatus;
    this.taskDataService.updateTask(task.id!, { status: newStatus });
  }

  /**
   * Sets drop indication state for visual feedback
   * @param {boolean} state - Dragging state
   */
  dropIndication(state: boolean): void {
    this.isDragging = state;
  }

  /**
   * Opens task details dialog
   * @param {Task} task - Task to display
   */
  openTaskDetails(task: Task): void {
    this.resetDialogState();
    this.setTaskDialogData(task);
  }

  /**
   * Resets dialog state before opening
   */
  private resetDialogState(): void {
    this.selectedTask = null;
    this.showTaskDialog = false;
    this.isEditMode = false;
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Sets task dialog data and opens dialog
   * @param {Task} task - Task to display
   */
  private setTaskDialogData(task: Task): void {
    this.selectedTask = task;
    this.showTaskDialog = true;
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Closes task dialog and resets state
   */
  closeTaskDialog(): void {
    this.showTaskDialog = false;
    this.selectedTask = null;
    this.isEditMode = false;
  }

  /**
   * Enables task edit mode
   */
  editTask(): void {
    this.isEditMode = true;
  }

  /**
   * Saves task changes to database
   * @param {Task} task - Task to save
   */
  async saveTask(task: Task): Promise<void> {
    if (!task.id) return;

    try {
      await this.updateTaskInDatabase(task);
      this.updateLocalTaskState(task);
    } catch (error) {
      this.handleTaskSaveError(error);
    }
  }

  /**
   * Updates task in database
   * @param {Task} task - Task to update
   */
  private async updateTaskInDatabase(task: Task): Promise<void> {
    const updateData: Partial<Task> = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignedUsers: task.assignedUsers,
      dueDate: task.dueDate,
      subtasks: task.subtasks,
      images: task.images,
    };

    await this.taskDataService.updateTask(task.id!, updateData);
  }

  /**
   * Updates local task state after successful save
   * @param {Task} task - Updated task
   */
  private updateLocalTaskState(task: Task): void {
    this.selectedTask = task;
    this.isEditMode = false;
  }

  /**
   * Handles task save errors
   * @param {any} error - Error that occurred
   */
  private handleTaskSaveError(error: any): void {
    console.error('Error updating task:', error);
    alert('Failed to update task. Please try again.');
  }

  /**
   * Deletes task from database
   * @param {string} taskId - ID of task to delete
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.taskDataService.deleteTask(taskId);
      this.closeTaskDialog();
    } catch (error) {
      this.handleTaskDeleteError(error);
    }
  }

  /**
   * Handles task deletion errors
   * @param {any} error - Error that occurred
   */
  private handleTaskDeleteError(error: any): void {
    console.error('Error deleting task:', error);
    alert('Failed to delete task. Please try again.');
  }

  /**
   * Toggles subtask completion status
   * @param {Subtask} subtask - Subtask to toggle
   */
  async toggleSubtask(subtask: Subtask): Promise<void> {
    subtask.completed = !subtask.completed;
    if (this.selectedTask?.id) {
      await this.updateSubtasksInDatabase();
    }
  }

  /**
   * Updates subtasks in database
   */
  private async updateSubtasksInDatabase(): Promise<void> {
    const updateData: Partial<Task> = {
      subtasks: this.selectedTask!.subtasks,
    };
    await this.taskDataService.updateTask(this.selectedTask!.id!, updateData);
  }

  /**
   * Navigates to add task component
   */
  openAddTaskComponent(): void {
    this.router.navigateByUrl('/addTask');
  }

  /**
   * Opens add task overlay or navigates based on screen size
   * @param {BoardStatus} taskStatus - Initial status for new task
   */
  openAddTaskOverlay(taskStatus: BoardStatus): void {
    if (this.isMobileDevice()) {
      this.navigateToAddTaskPage(taskStatus);
    } else {
      this.openDesktopAddTaskOverlay(taskStatus);
    }
  }

  /**
   * Checks if current device is mobile
   * @returns {boolean} True if mobile device
   */
  private isMobileDevice(): boolean {
    return window.innerWidth < 769;
  }

  /**
   * Navigates to add task page with status parameter
   * @param {BoardStatus} taskStatus - Task status to set
   */
  private navigateToAddTaskPage(taskStatus: BoardStatus): void {
    this.router.navigate(['/addTask'], { queryParams: { status: taskStatus } });
  }

  /**
   * Opens desktop add task overlay
   * @param {BoardStatus} taskStatus - Task status to set
   */
  private openDesktopAddTaskOverlay(taskStatus: BoardStatus): void {
    this.openAddTask = true;
    this.setTaskStatus = taskStatus;
  }

  /**
   * Closes add task window through form component
   */
  closeWindow(): void {
    this.taskCreateForm.closeWindow();
  }

  /**
   * Closes add task overlay
   */
  closeAddTaskOverlay(): void {
    this.openAddTask = false;
  }

  /**
   * Stops event propagation
   * @param {Event} event - Event to stop
   */
  stopEvent(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Performs search operation
   */
  performSearch(): void {
    this.searchSubject.next(this.searchTerm.toLowerCase().trim());
  }

  /**
   * Filters tasks by search term
   * @param {BoardColumn[]} columns - Columns to filter
   * @param {string} searchTerm - Search term
   * @returns {BoardColumn[]} Filtered columns
   */
  private filterTasksBySearchTerm(columns: BoardColumn[], searchTerm: string): BoardColumn[] {
    if (!searchTerm) {
      this.hasSearchResults = true;
      return columns;
    }

    const filteredColumns = this.getFilteredColumns(columns, searchTerm);
    this.updateSearchResultsState(filteredColumns);
    return filteredColumns;
  }

  /**
   * Gets filtered columns based on search term
   * @param {BoardColumn[]} columns - Columns to filter
   * @param {string} searchTerm - Search term
   * @returns {BoardColumn[]} Filtered columns
   */
  private getFilteredColumns(columns: BoardColumn[], searchTerm: string): BoardColumn[] {
    return columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => this.taskMatchesSearchTerm(task, searchTerm)),
    }));
  }

  /**
   * Checks if task matches search term
   * @param {Task} task - Task to check
   * @param {string} searchTerm - Search term
   * @returns {boolean} True if task matches
   */
  private taskMatchesSearchTerm(task: Task, searchTerm: string): boolean {
    const titleMatch = task.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = task.description ? task.description.toLowerCase().includes(searchTerm) : false;

    return titleMatch || descriptionMatch;
  }

  /**
   * Updates search results state
   * @param {BoardColumn[]} filteredColumns - Filtered columns
   */
  private updateSearchResultsState(filteredColumns: BoardColumn[]): void {
    const totalFilteredTasks = filteredColumns.reduce((total, column) => total + column.tasks.length, 0);
    this.hasSearchResults = totalFilteredTasks > 0;
  }
}
