import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  showToast = signal<boolean>(false);

  toastMessage = signal<string>('');

  SHOW_TIME: number = 2550;

  constructor() {}

  private handleToast(error: unknown): string {
    const err = error as { code?: string; message?: string };

    switch (err.code) {
      case 'contact/save/error':
        return 'Failed to update contact.';

      case 'contact/update/error':
        return 'Failed to update contact.';

      case 'contact/delete/error':
        return 'Failed to delete contact.';

      case 'contact/delete/all/error':
        return 'Failed to delete all contacts.';

      case 'contact/read/existingContacts/error':
        return 'Failed to load existing contact';

      case 'contact/add/error':
        return 'Failed to add contact';

      case 'contact/add/dummyError':
        return 'Failed to upload dummy data to database';

      case 'user/add/error':
        return 'Failed to add user';

      case 'user/add/colleciton/error':
        return 'Failed to add contacts collection to user';

      case 'task/update/error':
        return 'Failed to update task.';

      case 'task/save/error':
        return 'Failed to save task.';

      case 'task/delete/error':
        return 'Failed to delete task.';

      case 'task/user/id/error':
        return 'Failed to read user id.';

      case 'image/load/error':
        return 'Could not load task images from database';

      case 'auth/login/error':
        return 'Failed to authenticate user. Please try again';

      case 'auth/logout/error':
        return 'Failed to logout';

      case 'INVALID_PASSWORD':
        return 'Invalid password or email.';

      case 'auth/signup/error':
        return 'Failed to create account. Please try again';

      case 'guest/login/success':
        return 'Guest successfully logged in';

      default:
        return 'An unknown error occurred. Please try again.';
    }
  }

  throwToast(error: unknown) {
    this.showToast.set(true);

    this.toastMessage.set(this.handleToast(error));

    setTimeout(() => {
      this.showToast.set(false);
    }, this.SHOW_TIME);
  }
}
