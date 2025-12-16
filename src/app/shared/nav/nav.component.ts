import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';
import { CommonModule } from '@angular/common';

/**
 * Navigation Component
 *
 * Displays the main application navigation menu with conditional visibility
 * based on user authentication status and current route.
 */
@Component({
  selector: 'app-nav',
  imports: [RouterModule, CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  /**
   * Creates an instance of NavComponent.
   * @param {AuthenticationService} authService - Service for user authentication
   * @param {ContactDataService} contactDataService - Service for contact data operations
   * @param {Router} router - Angular router for navigation
   */
  constructor(public authService: AuthenticationService, public contactDataService: ContactDataService, private router: Router) {}

  /**
   * Determines if user is currently logged in
   * @returns {boolean} True if user is regular user or guest user
   */
  get isLoggedIn(): boolean {
    return this.authService.isRegularUser() || this.authService.isGuestUser();
  }
}
