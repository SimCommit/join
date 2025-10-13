import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';

/**
 * Register Component
 *
 * Handles user registration with form validation and password confirmation.
 * Creates new user accounts and contact entries.
 */
@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  // #region Properties
  /** The username entered during registration */
  userName: string = '';

  /** The user's email address */
  email: string = '';

  /** The password set by the user */
  password: string = '';

  /** The confirmation of the password to verify it matches */
  confirmPassword: string = '';

  /** Indicates whether the user has accepted the privacy policy */
  confirmprivacyPolicy: boolean = false;

  /** The error message displayed in the UI, e.g. on signup failure */
  errorMessage: string = '';

  /** Whether to show the password in the input field */
  showPassword: boolean = false;

  /** Whether to show the password confirmation in the input field */
  showPasswordConfirm: boolean = false;

  /** Whether the password input field is currently focused */
  passwordInput: boolean = false;

  /** Whether the password confirmation input field is currently focused */
  passwordInputConfirm: boolean = false;

  /** Indicates if the privacy policy checkbox was manually changed */
  confirmPrivacyPolicy: boolean = false;

  /** Indicates if the form was manually interacted with */
  manualChange: boolean = false;

  /** Becomes true if password and confirmPassword do not match */
  passwordDontMatch: boolean = false;
  // #endregion

  /**
   * Creates an instance of RegisterComponent.
   * @param {AuthenticationService} authenticationService - Service for handling authentication logic
   * @param {Router} router - Angular Router for navigation
   * @param {ContactDataService} contactDataService - Shared service for managing contact data and UI state
   */
  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private contactDataService: ContactDataService
  ) {}

  // #region Auth Methods
  /**
   * Handles the user sign-up process.
   *
   * This method checks whether the password and confirmation password match.
   * If they do, it attempts to sign up the user, create a contact entry,
   * show a success feedback message, and navigate to the login screen after a delay.
   * If any error occurs during sign-up or contact creation, it shows an error message instead.
   *
   * Updates the `passwordDontMatch` flag accordingly to reflect the password validation state.
   *
   * @returns {Promise<void>} A promise that resolves when the sign-up process is complete.
   */
  async onSignUp(): Promise<void> {
    if (this.doesPasswordMatch()) {
      try {
        await this.signUp();
        await this.createNewUser();
        await this.createNewUserContacts();
        this.navigateToLoginAfterUserfeedback();
        this.userFeedbackSuccess();
        this.passwordDontMatch = false;
      } catch (error) {
        this.userFeedbackError(error);
        this.passwordDontMatch = false;
      }
    } else {
      this.passwordDontMatch = true;
    }
  }

  /**
   * Checks if the password and confirmation password match.
   * @returns True if both passwords match, false otherwise.
   */
  doesPasswordMatch(): boolean {
    return this.confirmPassword === this.password;
  }

  /**
   * Signs up a new user using the provided email and password,
   * and updates the user's display name.
   * @returns A promise that resolves when the signup and update are complete.
   */
  async signUp(): Promise<void> {
    await this.authenticationService.signUp(this.email, this.password);
    await this.authenticationService.updateUserDisplayName(this.userName);
  }

  async createNewUser(): Promise<void> {
    await this.contactDataService.addUser({
      name: this.userName,
      email: this.email,
    });
  }

  async createNewUserContacts(): Promise<void> {
    await this.contactDataService.addContactToUserCollection(this.email, this.userName);

    // this.contactDataService.dummyContactsList.forEach((c) => this.contactDataService.addContactToUserCollection(c.email, c.name, c.phone));
  }

  /**
   * Navigates to the login page after a short delay and makes the signup button visible.
   */
  navigateToLoginAfterUserfeedback(): void {
    setTimeout(() => {
      this.router.navigateByUrl('/auth/login');
      this.contactDataService.signUpButtonVisible = true;
    }, 4000);
  }

  /**
   * Displays a success message after successful signup and clears it after a timeout.
   */
  userFeedbackSuccess(): void {
    this.errorMessage = '🎉 Signup successful!';
    this.clearError();
  }

  /**
   * Displays an error message from a failed signup attempt and clears it after a timeout.
   * @param error - The error thrown during the signup process.
   */
  userFeedbackError(error: unknown): void {
    this.errorMessage = (error as Error).message;
    this.clearError();
  }
  // #endregion

  // #region Register Methods
  /**
   * Toggles the visibility of the password or confirm password input field.
   *
   * Depending on the provided input type, this method toggles the corresponding
   * visibility flag and updates the input field icon accordingly.
   *
   * @param {'showPassword' | 'showPasswordConfirm'} input - Determines which password input to toggle (main or confirm).
   * @param {HTMLInputElement} inputElement - The input element whose visibility and icon are being toggled.
   */
  togglePasswordVisibility(input: 'showPassword' | 'showPasswordConfirm', inputElement: HTMLInputElement): void {
    if (this.isInputShowPassword(input)) {
      this.togglePasswordImage(inputElement);
    }
    if (this.isInputPaswordComfirm(input)) {
      this.togglePasswordConfirmImage(inputElement);
    }
  }

  /**
   * Handles hover behavior on the privacy policy link.
   * If the manual change is not active, it updates the checkbox state based on hover.
   *
   * @param hovering - True if the user is hovering over the link, false otherwise.
   */
  onLinkHover(hovering: boolean) {
    if (!this.manualChange) {
      this.confirmprivacyPolicy = hovering;
    }
  }

  /**
   * Toggles the manual change flag for the privacy policy checkbox.
   */
  togleManualChange() {
    this.manualChange = !this.manualChange;
  }

  /**
   * Navigates the user back to the login page and shows the signup button again.
   */
  goBackToLogin() {
    this.router.navigateByUrl('/auth/login');
    this.contactDataService.signUpButtonVisible = true;
  }

  /**
   * Clears the current error message after a delay of 4 seconds.
   */
  clearError() {
    setTimeout(() => {
      this.errorMessage = '';
    }, 4000);
  }

  /**
   * Checks whether the given input type corresponds to the password input.
   *
   * @param input - The input type identifier.
   * @returns True if the input is for the password, false otherwise.
   */
  isInputShowPassword(input: 'showPassword' | 'showPasswordConfirm'): boolean {
    return input == 'showPassword';
  }

  /**
   * Toggles the visibility of the password input and focuses the input element.
   *
   * @param inputElement - The HTML input element to focus.
   */
  togglePasswordImage(inputElement: HTMLInputElement): void {
    this.showPassword = !this.showPassword;
    inputElement.focus();
  }

  /**
   * Checks whether the given input type corresponds to the password confirmation input.
   *
   * @param input - The input type identifier.
   * @returns True if the input is for the password confirmation, false otherwise.
   */
  isInputPaswordComfirm(input: 'showPassword' | 'showPasswordConfirm'): boolean {
    return input == 'showPasswordConfirm';
  }

  /**
   * Toggles the visibility of the password confirmation input and focuses the input element.
   *
   * @param inputElement - The HTML input element to focus.
   */
  togglePasswordConfirmImage(inputElement: HTMLInputElement): void {
    this.showPasswordConfirm = !this.showPasswordConfirm;
    inputElement.focus();
  }
  // #endregion
}
