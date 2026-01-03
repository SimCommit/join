import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthenticationService } from '../../auth/services/authentication.service';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';
import { TaskDataService } from '../../main-pages/shared-data/task-data.service';
import { ToastService } from '../services/toast.service';
import { AppStateService } from '../services/app-state.service';

/**
 * Header component managing navigation, user authentication status and dropdown menu
 * Provides logout functionality and navigation to legal pages
 */
@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  /** Provides access to the toast service for UI messages */
  toastService = inject(ToastService);

  appStateService = inject(AppStateService);

  /**
   * Controls the visibility of the user dropdown menu
   */
  isDropdownOpen = false;

  /**
   * Creates an instance of the component and injects required services.
   *
   * @param authService - Service for managing authentication and user state.
   * @param router - Angular Router for navigation.
   */
  constructor(
    public authService: AuthenticationService,
    private router: Router,
    private contactDataService: ContactDataService,
    private taskDataService: TaskDataService
  ) {}

  /**
   * Initializes the component lifecycle.
   * - Sets up a global click listener to manage the dropdown state.
   * - Establishes the task data stream if a user is authenticated.
   */
  ngOnInit(): void {
    this.setupGlobalClickListener();
    this.connectTaskDataServiceStream();
  }

  /**
   * Connects the task data stream for real-time updates from Firestore.
   * Ensures that the stream is only initialized when a user (regular or guest)
   * is authenticated to prevent unauthorized Firestore access.
   */
  connectTaskDataServiceStream(): void {
    if (this.authService.currentUser) {
      this.taskDataService.connectTaskStream();
    }
  }

  /**
   * Sets up document click listener to close dropdown when clicking outside
   * Improves user experience by auto-closing dropdown menu
   */
  private setupGlobalClickListener(): void {
    document.addEventListener('click', (event) => {
      this.handleOutsideClick(event);
    });
  }

  /**
   * Handles clicks outside the avatar container
   * @param {Event} event - The click event
   */
  private handleOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target?.closest('.avatar-container')) {
      this.isDropdownOpen = false;
    }
  }

  /**
   * Determines if user is currently logged in
   * @returns {boolean} True if user is regular user or guest user
   */
  get isLoggedIn(): boolean {
    return this.authService.isRegularUser() || this.authService.isGuestUser();
  }

  /**
   * Determines if we should hide avatar on mobile legal pages
   * @returns {boolean} True if on legal pages and user is guest (not regular user)
   */
  get shouldHideAvatarOnMobileLegal(): boolean {
    const currentUrl = this.router.url;
    const isLegalPage = currentUrl.includes('/legal-notice') || currentUrl.includes('/privacy-policy');
    const isGuestUser = this.authService.isGuestUser();
    return isLegalPage && isGuestUser;
  }

  /**
   * Gets user initials for avatar display
   * @returns {string} User initials or 'G' for guest
   */
  get userInitials(): string {
    const currentUser = this.authService.currentUser;
    if (currentUser?.displayName) {
      return this.contactDataService.extractInitials(currentUser.displayName);
    }
    return 'G';
  }

  /**
   * Toggles the visibility of the avatar dropdown menu
   * @param {Event} event - The click event
   */
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Closes the dropdown menu
   * Helper method for consistent dropdown state management
   */
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  /**
   * Navigates to help page and closes dropdown
   * Provides clean navigation with state cleanup
   */
  navigateToHelp(): void {
    this.router.navigate(['/help']);
    this.closeDropdown();
  }

  /**
   * Navigates to legal notice page and closes dropdown
   * Provides clean navigation with state cleanup
   */
  navigateToLegalNotice(): void {
    this.router.navigate(['/legal-notice']);
    this.closeDropdown();
  }

  /**
   * Navigates to privacy policy page and closes dropdown
   * Provides clean navigation with state cleanup
   */
  navigateToPrivacyPolicy(): void {
    this.router.navigate(['/privacy-policy']);
    this.closeDropdown();
  }

  /**
   * Logs out the current user and redirects to login
   * Handles cleanup and error scenarios gracefully
   */
  async logout(): Promise<void> {
    try {
      this.appStateService.afterLogout()
      await this.performLogout();
      this.contactDataService.notInLogIn = false;
    } catch (error) {
      this.handleLogoutError();
    }
  }

  /**
   * Performs the actual logout process
   * Clears storage and navigates to login page
   */
  private async performLogout(): Promise<void> {
    this.clearUserData();
    await this.authService.logout();
    this.redirectToLogin();
  }

  /**
   * Handles logout errors with fallback cleanup
   */
  private handleLogoutError(): void {
    this.toastService.throwToast({ code: 'auth/logout/error' });
    this.clearUserData();
    this.redirectToLogin();
  }

  /**
   * Clears all user data from storage
   * Ensures complete cleanup of user session
   */
  private clearUserData(): void {
    localStorage.clear();
    sessionStorage.clear();
  }

  /**
   * Redirects to login page and closes dropdown
   * Final step in logout process
   */
  private redirectToLogin(): void {
    this.router.navigate(['/auth/login']);
    this.closeDropdown();
  }
}
