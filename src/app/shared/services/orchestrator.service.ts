import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';
import { TaskDataService } from '../../main-pages/shared-data/task-data.service';

@Injectable({
  providedIn: 'root',
})
export class OrchestratorService {
  joinAppState = signal<JoinAppState>('SIGNED_OUT');
  orchestratorStarted = signal<boolean>(false);
  guestInitDone = signal<boolean>(false);

  authenticationService = inject(AuthenticationService);
  contactDataService = inject(ContactDataService);
  taskDataService = inject(TaskDataService);

  constructor() {
    this.initOrchestratorEffect();
  }

  async afterLogin(): Promise<void> {
    console.log(this.joinAppState());
    if (this.authenticationService.currentUser === null) throw new Error('auth/login/error');

    this.joinAppState.set('AUTHENTICATED');
    console.log(this.joinAppState());

    this.initData();
    console.log(this.joinAppState());
  }

  private async initData() {
    this.contactDataService.connectUserStream();
  }

  initOrchestratorEffect() {
    if (this.orchestratorStarted()) return;

    this.orchestratorStarted.set(true);

    effect(async (): Promise<void> => {
      const userId = this.contactDataService.currentUserIdSignal();
      const state = this.joinAppState();

      if (!userId) return;

      if (state === 'AUTHENTICATED') {
        this.joinAppState.set('USER_INITIALIZED');

        this.contactDataService.connectContactStream();
        this.taskDataService.connectTaskStream();
      }

      if (state === 'USER_INITIALIZED' && !this.authenticationService.isGuestUser()) {
        this.joinAppState.set('APP_READY');
      } else if (state === 'USER_INITIALIZED' && this.authenticationService.isGuestUser()) {
        if (!this.guestInitDone()) {
          this.guestInitDone.set(true);
          await this.handleGuestInit();
        }
        this.joinAppState.set('APP_READY');
      }
    });
  }

  private async handleGuestInit(): Promise<void> {
    await this.contactDataService.loadExistingContacts();
    await this.contactDataService.setCleanContacts();
  }

  async afterLogout() {
    // Streams stoppen
    // und mehr
    await this.contactDataService.disconnectContactAndUserStreams();
    await this.taskDataService.disconnectTaskStream();
    this.orchestratorStarted.set(false);
    this.guestInitDone.set(false);

    this.joinAppState.set('SIGNED_OUT');
    console.log(this.joinAppState());
  }

  // async restoreSession() {
  //   if (this.authenticationService.isLoggedIn()) {
  //     await this.afterLogin();
  //   } else {
  //     await this.afterLogout();
  //   }
  // }
}

type JoinAppState = 'SIGNED_OUT' | 'AUTHENTICATED' | 'USER_INITIALIZED' | 'APP_READY';
