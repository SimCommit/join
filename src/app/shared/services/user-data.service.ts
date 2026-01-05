import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, CollectionReference, DocumentData, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';
import { TaskDataService } from '../../main-pages/shared-data/task-data.service';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  // #region State & Dependencies
  /** Firebase Firestore instance */
  private readonly firestore = inject(Firestore);

  /** Angular environment injector for dependency injection context */
  private readonly injector = inject(EnvironmentInjector);

  /** Service providing current authentication state and user info */
  private readonly authenticationService = inject(AuthenticationService);

  /** Service for managing user contacts */
  contactDataService = inject(ContactDataService);

  /** Service for managing user tasks */
  taskDataService = inject(TaskDataService);

  /**
   * List of all users fetched from the Firestore 'users' collection.
   * Used to resolve Firestore user documents by authentication UID.
   */
  userList: { uid: string; email: string; id: string }[] = [];

  /** Flag indicating whether the user data has been fully loaded and streams initialized */
  userIsReady: boolean = false;

  /** Unsubscribe handle for the Firestore user listener */
  unsubUserList?: () => void;
  // #endregion

  constructor() {}

  // #region Lifecycle
  /**
   * Establishes a real-time Firestore listener for the 'users' collection.
   * Clears the current user list before subscribing.
   * For each snapshot update, adds users to `userList`.
   * When the list is first populated, marks `userIsReady` and connects the contact stream.
   */
  connectUserStream(): void {
    if (this.unsubUserList) return;

    this.userList = [];

    runInInjectionContext(this.injector, () => {
      this.unsubUserList = onSnapshot(this.getUserRef(), async (list) => {
        list.forEach((element: QueryDocumentSnapshot<DocumentData>) => this.addUserToUserList(element));

        if (!this.userIsReady) {
          const userId = this.getCurrentUserId();
          this.contactDataService.currentUserId = userId;
          this.taskDataService.currentUserId = userId;
          this.contactDataService.connectContactStream();
          this.taskDataService.connectTaskStream();
          await this.taskDataService.addDummyTasksToEmptyUserTasks();
          this.userIsReady = true;
        }
      });
    });
  }

  /**
   * Stops the active Firestore contacts and user listeners if present.
   * Resets the `userIsReady` flag and current user IDs in dependent services.
   */
    disconnectUserStream() {
    if (this.unsubUserList) {
      this.unsubUserList();
      this.unsubUserList = undefined;
      this.userIsReady = false;
      this.contactDataService.currentUserId = '-';
    }
  }
  // #endregion

  // #region User Resolution
  /**
   * Extracts user data from a Firestore document and adds it to `userList`.
   * @param {QueryDocumentSnapshot<DocumentData>} element - Firestore document snapshot containing user data
   */
  addUserToUserList(element: QueryDocumentSnapshot<DocumentData>): void {
    const uid = element.data()['uid'] as string;
    const email = element.data()['email'] as string;
    const id = element.id;
    this.userList.push({ uid, email, id });
  }

  /**
   * Returns the Firestore document ID of the currently authenticated user.
   * Assumes that a user is authenticated and a corresponding user document exists.
   * Throws an error if this invariant is violated.
   *
   * @returns {string} The Firestore user document ID.
   */
  getCurrentUserId(): string {
    const currentUser = this.authenticationService.currentUser;

    if (currentUser === null) {
      throw new Error('Invariant violation: no authenticated user');
    }

    let user = this.userList.find((u) => u.uid === currentUser.uid);

    if (user === undefined) {
      throw new Error('Invariant violation: user document not found');
    }

    return user.id;
  }

  // #endregion

  // #region Firestore References

  /**
   * Returns the Firestore collection reference for all registered users.
   * @returns {CollectionReference<DocumentData>} Firestore collection reference for users
   */
  getUserRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, 'users');
  }
  // #endregion
}
