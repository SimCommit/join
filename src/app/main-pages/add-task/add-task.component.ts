import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { TaskCreateFormComponent } from '../shared/task-create-form/task-create-form.component';
import { ActivatedRoute } from '@angular/router';
import { BoardStatus } from '../shared-data/task.interface';
import { Subscription } from 'rxjs';

/**
 * Add Task component that provides a dedicated page for creating new tasks
 * Handles task status initialization from query parameters and form management
 */
@Component({
  selector: 'app-add-task',
  imports: [TaskCreateFormComponent],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.scss',
})
export class AddTaskComponent implements OnInit, OnDestroy {
  /**
   * Reference to the child component responsible for task creation form functionality.
   */
  @ViewChild(TaskCreateFormComponent) taskCreateForm!: TaskCreateFormComponent;

  /**
   * Initial task status, derived from query parameters or set to default ('todo').
   */
  taskStatus: BoardStatus = 'todo';

  /**
   * Subscription to query parameter changes for dynamic task status detection.
   * Automatically cleaned up on component destruction.
   */
  private queryParamsSubscription?: Subscription;

  /**
   * Injects the ActivatedRoute service to access query parameters.
   * @param route - Provides access to the current route and its parameters.
   */
  constructor(private route: ActivatedRoute) {}

  /**
   * Initializes component and sets up query parameter subscription
   */
  ngOnInit(): void {
    this.setupQueryParameterSubscription();
  }

  /**
   * Cleans up subscriptions on component destroy
   */
  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  /**
   * Sets up subscription to query parameters for task status
   */
  private setupQueryParameterSubscription(): void {
    this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
      this.handleQueryParameters(params);
    });
  }

  /**
   * Handles query parameters and extracts task status
   * @param {any} params - Query parameters object
   */
  private handleQueryParameters(params: any): void {
    if (this.hasStatusParameter(params)) {
      this.setTaskStatusFromParams(params);
    }
  }

  /**
   * Checks if status parameter exists in query params
   * @param {any} params - Query parameters object
   * @returns {boolean} True if status parameter exists
   */
  private hasStatusParameter(params: any): boolean {
    return Boolean(params['status']);
  }

  /**
   * Sets task status from query parameters
   * @param {any} params - Query parameters object
   */
  private setTaskStatusFromParams(params: any): void {
    this.taskStatus = params['status'] as BoardStatus;
  }

  /**
   * Cleans up component subscriptions
   */
  private cleanupSubscriptions(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  /**
   * Closes the task creation window through the form component
   */
  closeWindow(): void {
    this.taskCreateForm.closeWindow();
  }
}
