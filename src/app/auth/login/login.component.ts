import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';
import { Router, RouterModule } from '@angular/router';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Login Component
 *
 * Handles user authentication with email and password.
 * Provides login form functionality and guest access option.
 */
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  // #region Properties
  /** Provides access to the toast service for UI messages */
  toastService = inject(ToastService);

  /**
   * Indicates whether the password input field is focused or active.
   */
  passwordInput: boolean = false;

  /**
   * Indicates whether the email input field is focused or active.
   */
  emailInput: boolean = false;

  /**
   * Determines if the password should be displayed in plain text.
   */
  showPassword: boolean = false;

  /**
   * Stores the password entered by the user for login.
   */
  passwordInputTest: string = '';

  /**
   * Stores the email entered by the user for login.
   */
  emailInputTest: string = '';

  /**
   * Contains the error message to be displayed to the user in case of login failure or other issues.
   */
  errorMessage: string = '';

  /**
   * Lock flag used to throttle login actions.
   * Set by {@link spamGuard} for 5000 ms to prevent multiple login triggers in quick succession.
   * @default false
   */
  loginIsLocked: boolean = false;
  // #endregion

  /**
   * Creates an instance of LoginComponent.
   * @param {AuthenticationService} authenticationService - Service for user authentication
   * @param {Router} router - Angular router for navigation
   * @param {ContactDataService} contactDataService - Service for contact data operations
   */
  constructor(private authenticationService: AuthenticationService, private router: Router, public contactDataService: ContactDataService) {}

  // #region UI Interactions
  /**
   * Toggles the visibility of the password input field and sets focus on the input element.
   * @param inputElement - The HTML input element for the password field.
   */
  togglePasswordVisibility(inputElement: HTMLInputElement): void {
    this.showPassword = !this.showPassword;
    inputElement.focus();
  }

  /**
   * Prevents the input field from losing focus when an interactive element is clicked.
   * @param event - The mouse event triggered by the user.
   */
  preventBlur(event: MouseEvent): void {
    event.preventDefault();
  }
  // #endregion

  // #region Login
  /**
   * Logs in the user with the provided email and password.
   * On success, redirects to the summary or mobile greeting screen based on screen size.
   * Displays an error message if authentication fails.
   */
  async onLogin(): Promise<void> {
    try {
      await this.authenticationService.signIn(this.emailInputTest, this.passwordInputTest);

      if (this.isMobile) {
        this.router.navigate(['/mobile-greeting']);
      } else {
        this.router.navigate(['/summary']);
      }

      this.contactDataService.notInLogIn = true;
    } catch (error) {
      this.toastService.throwToast({ code: 'INVALID_PASSWORD' });
      this.clearError();
    }
  }

  /**
   * Logs in a guest user without credentials.
   *
   * - Uses {@link spamGuard} to prevent repeated or rapid login attempts.
   * - Loads and resets the guest user's contact data.
   * - Redirects to the correct route depending on the device type.
   * - Displays an error message if authentication fails.
   *
   * @returns {Promise<void>} Resolves when the guest login and navigation are complete.
   */
  async onGuestLogin(): Promise<void> {
    if (this.loginIsLocked) return;
    this.spamGuard();

    try {
      await this.authenticationService.guestSignIn();
      this.toastService.throwToast({ code: 'guest/login/success' });
      await this.contactDataService.loadExistingContacts();
      await this.contactDataService.setCleanContacts();

      if (this.isMobile) {
        this.router.navigate(['/mobile-greeting']);
      } else {
        this.router.navigate(['/summary']);
      }

      this.contactDataService.notInLogIn = true;
    } catch (error) {
      this.errorMessage = (error as Error).message;
      this.clearError();
    }
  }
  // #endregion

  // #region Getters / Utils
  /**
   * Returns whether the device is considered mobile based on screen width.
   * @returns {boolean} True if screen width is 768px or less.
   */
  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Clears the current error message after a 4-second timeout.
   */
  clearError(): void {
    setTimeout(() => {
      this.errorMessage = '';
    }, 4000);
  }

  /**
   * Temporarily locks login actions to prevent spam or repeated triggers.
   * Used by {@link onGuestLogin} to disable guest login for 5 seconds
   * after each login attempt.
   */
  private spamGuard(): void {
    this.loginIsLocked = true;
    setTimeout(() => {
      this.loginIsLocked = false;
    }, 5000);
  }
  // #endregion
}
