import { Timestamp } from 'firebase/firestore';

/**
 * Union type representing the possible board column statuses
 * Used for task workflow states and board organization
 */
export type BoardStatus = 'todo' | 'inprogress' | 'awaiting' | 'done';

/**
 * Interface for board column configuration
 * Represents a single column in the kanban board
 */
export interface BoardColumn {
  /** Unique identifier for the board column */
  id: string;
  /** Display title of the column */
  title: string;
  /** Current status type of the column */
  status: BoardStatus;
  /** Array of tasks assigned to this column */
  tasks: Task[];
  /** Array of statuses that can accept dropped tasks */
  connectedStatuses: BoardStatus[];
}

/**
 * Interface for individual subtask items
 * Represents a smaller task within a main task
 */
export interface Subtask {
  /** Unique identifier for the subtask */
  id: string;
  /** Title/description of the subtask */
  title: string;
  /** Completion status of the subtask */
  completed: boolean;
}

/**
 * Interface for main task objects used in the application
 * Represents a complete task with all client-side properties
 */
export interface Task {
  /** Optional unique identifier (undefined for new tasks) */
  id?: string;
  /** Main title of the task */
  title: string;
  /** Detailed description of the task */
  description: string;
  /** Category classification for the task */
  category: string;
  /** Priority level of the task */
  priority: 'low' | 'medium' | 'urgent';
  /** Current workflow status of the task */
  status: 'todo' | 'inprogress' | 'awaiting' | 'done';
  /** Array of user IDs assigned to this task */
  assignedUsers: string[];
  /** Date when the task was created */
  createdDate: Date;
  /** Optional due date for task completion */
  dueDate?: Date;
  /** Array of subtasks belonging to this task */
  subtasks: Subtask[];
  /** Array of attached images */
  images: TaskImage[];
}

/**
 * Interface for task objects stored in Firestore database
 * Uses Firestore Timestamp objects instead of JavaScript Date objects
 */
export interface FirestoreTask {
  /** Main title of the task */
  title: string;
  /** Detailed description of the task */
  description: string;
  /** Category classification for the task */
  category: string;
  /** Priority level of the task */
  priority: 'low' | 'medium' | 'urgent';
  /** Current workflow status of the task */
  status: 'todo' | 'inprogress' | 'awaiting' | 'done';
  /** Array of user IDs assigned to this task */
  assignedUsers: string[];
  /** Firestore timestamp when the task was created */
  createdDate: Timestamp;
  /** Firestore timestamp for due date, null if no due date set */
  dueDate: Timestamp | null;
  /** Array of subtasks belonging to this task */
  subtasks: Subtask[];
  /** Array of attached images */
  images: TaskImage[];
}

/**
 * Interface for image attachments linked to a task
 * Represents a single image with metadata and encoded content
 */
export interface TaskImage {
  /** Current filename of the image used in storage or display */
  filename: string;
  /** Original filename of the image before any renaming operations, used for display on initial upload */
  filenameWithoutType: string;
  /** File size after of the compressed image */
  size: number;
  /** extension of the image name */
  fileExtension: string;
  /** mimeType of the image */
  mimeType: string;
  /** Base64-encoded image data used for upload, storage, and inline preview */
  base64: string;
}
