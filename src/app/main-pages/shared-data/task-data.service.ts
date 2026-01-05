import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Firestore, collection, doc, addDoc, deleteDoc, updateDoc, DocumentData, CollectionReference, Timestamp, collectionData } from '@angular/fire/firestore';
import { Task, BoardColumn, FirestoreTask } from './task.interface';
import { ToastService } from '../../shared/services/toast.service';
import { getDocs } from 'firebase/firestore';

/**
 * Service for managing tasks in Firestore.
 * Handles real-time updates, CRUD operations, and conversions between Firestore and internal task format.
 *
 * @class TaskDataService
 */
@Injectable({
  providedIn: 'root',
})
export class TaskDataService {
  // #region Properties
  /** Provides access to the toast service for UI messages */
  toastService = inject(ToastService);

  /**
   * Holds the current list of Task objects as a reactive data stream.
   */
  private tasksSubject: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>([]);

  /**
   * Observable stream of all Task objects, updated in real time.
   */
  public tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  /**
   * Stores the unsubscribe function for the tasks observable.
   * Used for cleanup to avoid memory leaks.
   */
  private unsubscribeFromTasks?: () => void;

  /**
   * Static board columns with status mapping for Kanban UI.
   */
  private columns: BoardColumn[] = [
    {
      id: '1',
      title: 'ToDo',
      status: 'todo',
      tasks: [],
      connectedStatuses: ['inprogress', 'awaiting', 'done'],
    },
    {
      id: '2',
      title: 'In Progress',
      status: 'inprogress',
      tasks: [],
      connectedStatuses: ['todo', 'awaiting', 'done'],
    },
    {
      id: '3',
      title: 'Awaiting Feedback',
      status: 'awaiting',
      tasks: [],
      connectedStatuses: ['todo', 'inprogress', 'done'],
    },
    {
      id: '4',
      title: 'Done',
      status: 'done',
      tasks: [],
      connectedStatuses: ['todo', 'inprogress', 'awaiting'],
    },
  ];

  /**
   * AngularFire Firestore instance for database access (injected).
   */
  private readonly firestore = inject(Firestore);

  /**
   * Angular EnvironmentInjector for running code in the correct injection context.
   */
  private readonly injector = inject(EnvironmentInjector);

  /** Firestore document ID of the currently authenticated user */
  currentUserId!: string;

  /** Preloaded dummy tasks fetched from the global Firestore 'tasks' collection */
  dummyTaskList: FirestoreTask[] = [];

  /** Tracks existing user task document IDs for existence checks and initialization logic */
  existingTaskList: { id: string }[] = [];
  // #endregion

  // #region Lifecycle
  /**
   * Initializes the task listener and sets up the tasks stream.
   *
   * - Subscribes to the Firestore 'tasks' collection as an observable stream.
   * - Uses the RxJS `map` operator to transform the emitted list of tasks.
   * - Inside the RxJS `map`, uses JavaScript’s `Array.map` to convert each FirestoreTask object:
   *   - Transforms Firestore Timestamp fields (e.g., createdDate, dueDate) into native JavaScript Date objects
   *     using `translateTimestampToDate`.
   * - Updates the `tasksSubject` with the converted Task array for reactive use in the UI.
   * - Stores the unsubscribe function to allow proper cleanup later.
   */
  connectTaskStream(): void {
    runInInjectionContext(this.injector, () => {
      const taskSubStream = collectionData(this.getUserTasksRef(), {
        idField: 'id',
      })
        .pipe(map((tasks) => (tasks as FirestoreTask[]).map((task) => this.translateTimestampToDate(task))))
        .subscribe((tasks) => this.tasksSubject.next(tasks as Task[]));
      this.unsubscribeFromTasks = () => taskSubStream.unsubscribe();
    });
  }

  /**
   * Unsubscribes from the tasks observable stream to prevent memory leaks.
   */
  disconnectTaskStream(): void {
    this.unsubscribeFromTasks?.();
  }
  // #endregion

  /**
   * Loads all existing task document IDs from the current user's Firestore task collection
   * into `existingTaskList`.
   * Used to determine whether the user already has tasks stored.
   */
  public async loadExistingTasks(): Promise<void> {
    this.existingTaskList = [];
    const existingTasksSnap = await runInInjectionContext(this.injector, () => getDocs(this.getUserTasksRef()));

    existingTasksSnap.forEach((doc) => {
      const id = doc.id;
      this.existingTaskList.push({ id });
    });
  }

  /**
   * Loads all predefined dummy tasks from the global Firestore 'tasks' collection
   * into `dummyTaskList`.
   * These tasks are used to initialize empty user task collections.
   */
  public async loadDummyTasks(): Promise<void> {
    this.dummyTaskList = [];
    const dummyTasksSnap = await runInInjectionContext(this.injector, () => getDocs(this.getTasksRef()));

    dummyTasksSnap.forEach((doc) => {
      const data = doc.data() as FirestoreTask;
      this.dummyTaskList.push(data);
    });
  }

  /**
   * Initializes the current user's task collection with predefined dummy tasks
   * if no user-specific tasks exist yet.
   *
   * Loads existing user tasks to check for emptiness and only inserts dummy tasks
   * when the collection is empty to avoid duplicate entries.
   */
  async addDummyTasksToEmptyUserTasks() {
    await this.loadExistingTasks();

    if (this.existingTaskList.length === 0) {
      await this.loadDummyTasks();
      this.dummyTaskList.forEach((task) => {
        this.addFirestoreTask(task);
      });
    }
  }

  // #region Getters

  /**
   * Returns a reference to the global Firestore 'tasks' collection
   * containing predefined dummy or template tasks.
   * @returns {CollectionReference<DocumentData>} Firestore collection reference for global tasks
   */
  private getTasksRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, `tasks`);
  }

  /**
   * Returns a reference to the Firestore 'tasks' collection.
   * @returns {CollectionReference<DocumentData, DocumentData>} Firestore collection reference for tasks.
   */
  private getUserTasksRef(): CollectionReference<DocumentData, DocumentData> {
    return collection(this.firestore, `users/${this.currentUserId}/tasks`);
  }

  /**
   * Returns an observable of board columns, each containing the tasks filtered by their status.
   * @returns {Observable<BoardColumn[]>} Observable stream of board columns with grouped tasks.
   */
  getBoardColumns(): Observable<BoardColumn[]> {
    return this.tasks$.pipe(
      map((tasks) => {
        return this.columns.map((column) => ({
          ...column,
          tasks: tasks.filter((task) => task.status === column.status),
        }));
      })
    );
  }
  // #endregion

  // #region CRUD-Methods
  /**
   * Adds a new task to the current user's Firestore task collection.
   * Converts the internal Task model into a Firestore-compatible format before persisting it.
   * Runs inside Angular's injection context to ensure access to injected Firestore dependencies.
   * @param {Task} task - The task object to add
   * @returns {Promise<void>} Promise that resolves when the task is added
   */
  async addTask(task: Task): Promise<void> {
    const taskToAdd: FirestoreTask = this.translateTaskToFirestoreTask(task);

    try {
      await runInInjectionContext(this.injector, () => addDoc(this.getUserTasksRef(), taskToAdd));
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'task/save/error' });
    }
  }

  /**
   * Adds an existing FirestoreTask directly to the current user's Firestore task collection.
   * Intended for inserting predefined or cloned tasks (e.g. dummy or seed data).
   * Runs inside Angular's injection context to ensure access to injected dependencies.
   * Uses Firestore auto-generated document IDs and does not check for duplicates.
   * @param {FirestoreTask} task - The Firestore-formatted task object to add
   * @returns {Promise<void>} Promise that resolves when the task is added
   */
  async addFirestoreTask(task: FirestoreTask): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => addDoc(this.getUserTasksRef(), task));
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'task/save/error' });
    }
  }

  /**
   * Deletes a task from the Firestore 'tasks' collection by ID.
   * Runs inside the Angular injection context to avoid zone errors.
   * @param {string} taskId - The ID of the task to delete.
   * @returns {Promise<void>} Promise that resolves when the task is deleted.
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => {
        const docRef = doc(this.firestore, `users/${this.currentUserId}/tasks`, taskId);
        return deleteDoc(docRef);
      });
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'task/delete/error' });
    }
  }

  /**
   * Updates an existing task in the Firestore 'tasks' collection.
   * Runs inside the Angular injection context to avoid zone errors.
   * @param {string} taskId - The ID of the task to update.
   * @param {Partial<FirestoreTask>} updateData - The data to update (partial task object).
   * @returns {Promise<void>} Promise that resolves when the task is updated.
   */
  async updateTask(taskId: string, updateData: Partial<Task>): Promise<void> {
    const updateDataFirestore: Partial<FirestoreTask> = this.translatePartialTaskToPartialFirestoreTask(updateData);

    try {
      await runInInjectionContext(this.injector, () => {
        const docRef = doc(this.firestore, `users/${this.currentUserId}/tasks`, taskId);
        return updateDoc(docRef, updateDataFirestore);
      });
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'task/update/error' });
    }
  }
  // #endregion

  // #region Helpers
  /**
   * Extracts dueDate from the FirestoreTask object and creates a new object containing all other properties.
   * Converts Firestore Timestamp fields (createdDate, dueDate) to JavaScript Date objects.
   *
   * @param task - The FirestoreTask object as retrieved from Firestore (with Timestamp fields).
   * @returns A Task object where all Timestamps are converted to Date, and dueDate is only set if it exists.
   */
  translateTimestampToDate(task: FirestoreTask): Task {
    const { dueDate, ...taskWithoutDueDate } = task;

    return {
      ...taskWithoutDueDate,
      createdDate: task.createdDate instanceof Timestamp ? task.createdDate.toDate() : task.createdDate,
      ...(dueDate instanceof Timestamp ? { dueDate: dueDate.toDate() } : {}),
    };
  }

  /**
   * Converts a partial Task object with possible JavaScript Date fields to a partial FirestoreTask object,
   * where Date fields are converted to Firestore Timestamps if present, or set to null if not set (for dueDate).
   *
   * @param {Partial<Task>} task - The partial Task object with optional Date fields.
   * @returns {Partial<FirestoreTask>} A partial FirestoreTask object where date fields are Firestore Timestamps or null if not set.
   */
  translatePartialTaskToPartialFirestoreTask(task: Partial<Task>): Partial<FirestoreTask> {
    const result: Partial<FirestoreTask> = {};
    if (task.title) result.title = task.title;
    if (task.description) result.description = task.description;
    if (task.category) result.category = task.category;
    if (task.priority) result.priority = task.priority;
    if (task.status) result.status = task.status;
    if (task.assignedUsers) result.assignedUsers = task.assignedUsers;
    if (task.subtasks) result.subtasks = task.subtasks;
    if (task.images) result.images = task.images;

    if (task.createdDate) {
      result.createdDate = this.convertToTimestamp(task.createdDate);
    }
    if ('dueDate' in task) {
      result.dueDate = this.convertToTimestampOrNull(task.dueDate);
    }

    return result;
  }

  /**
   * Converts a Task object with JavaScript Date fields to a FirestoreTask object
   * where all date fields are converted to Firestore Timestamps, except fields that are not set,
   * which will be set to null (e.g., dueDate may be null).
   *
   * @param {Task} task - The Task object with JavaScript Date fields.
   * @returns {FirestoreTask} A FirestoreTask object where date fields are Firestore Timestamps or null if not set.
   */
  translateTaskToFirestoreTask(task: Task): FirestoreTask {
    return {
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      assignedUsers: task.assignedUsers,
      createdDate: task.createdDate instanceof Date ? Timestamp.fromDate(task.createdDate) : task.createdDate,
      dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
      subtasks: task.subtasks,
      images: task.images,
    };
  }

  /**
   * Converts a JavaScript Date to a Firestore Timestamp.
   * If the input is already a Firestore Timestamp, it is returned unchanged.
   *
   * @param {Date | Timestamp} date - The value to convert.
   * @returns {Timestamp} The input as a Firestore Timestamp.
   */
  convertToTimestamp(date: Date | Timestamp): Timestamp {
    return date instanceof Date ? Timestamp.fromDate(date) : date;
  }

  /**
   * Converts a JavaScript Date to a Firestore Timestamp.
   * If the input is already a Firestore Timestamp, it is returned unchanged.
   * If the input is undefined or null, null is returned.
   * This function handles all cases using a conditional (ternary) expression.
   *
   * @param {Date | Timestamp | undefined | null} date - The value to convert.
   * @returns {Timestamp | null} A Firestore Timestamp if input is a Date or Timestamp, or null if input is undefined or null.
   */
  convertToTimestampOrNull(date: Date | undefined | null): Timestamp | null {
    return date instanceof Date ? Timestamp.fromDate(date) : date ?? null;
  }
  // #endregion
}
