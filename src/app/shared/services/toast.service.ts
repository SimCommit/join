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
    const err = error as { code?: string };

    switch (err.code) {
      case 'test/test':
        return 'This is a test.';
      case 'guest/login/success':
        return 'Guest Login: success';
      default:
        return 'An unknown error occurred. Please try again.';
    }
  }

  throwToast(error: unknown) {
    this.showToast.set(true);

    this.toastMessage.set(this.handleToast(error))

    setTimeout(() => {
      this.showToast.set(false);
    }, this.SHOW_TIME);
  }
}
