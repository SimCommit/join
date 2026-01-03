import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { UserDataService } from './user-data.service';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';
import { TaskDataService } from '../../main-pages/shared-data/task-data.service';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  // #region State & Dependencies
  /** Provides access to the current authentication state and authenticated user. */
  private readonly authenticationService = inject(AuthenticationService);

  /** Manages user-related data and resolves Firestore user documents. */
  private readonly userDataService = inject(UserDataService);

  /** Handles contact data streams and contact-related Firestore operations. */
  private readonly contactDataService = inject(ContactDataService);

  /** Handles task data streams and task-related Firestore operations. */
  private readonly taskDataService = inject(TaskDataService);

  /** Represents the current application authentication state. */
  appStateSignal = signal<AppState>('SIGNED_OUT');
  // #endregion

  constructor() {
    this.orchestratorEffect();
    this.reloadEffect();
    // console.log("AppStateService was init");    
  }

  afterLogin() {
    this.appStateSignal.set('AUTHENTICATED');
  }

  afterReload() {
    this.appStateSignal.set('AUTHENTICATED');
  }

  afterLogout() {
    this.appStateSignal.set("SIGNED_OUT")
  }

  reloadEffect() {
    effect(() => {
      console.log('Hello from reloadEffect');

      if (this.authenticationService.authenticatedSignal() === true && this.appStateSignal() === 'SIGNED_OUT') {
        this.afterReload();
      }
    });
  }

  orchestratorEffect() {
    effect(() => {
      console.log(`The current state is: ${this.appStateSignal()}`);

      if (this.appStateSignal() === 'AUTHENTICATED' && this.authenticationService.currentUser) {
        this.userDataService.connectUserStream();
      }

      if (!this.contactDataService.unsubList && this.appStateSignal() === 'AUTHENTICATED' && this.userDataService.userListLengthSignal() > 0) {
        this.contactDataService.connectStreams();
        this.taskDataService.connectTaskStream();
      }

      if (this.appStateSignal() === 'SIGNED_OUT') {
        this.contactDataService.disconnectContactStream();
        this.taskDataService.disconnectTaskStream();
        this.userDataService.disconnectUserStream();
      }
    });
  }
}

type AppState = 'SIGNED_OUT' | 'AUTHENTICATED';
