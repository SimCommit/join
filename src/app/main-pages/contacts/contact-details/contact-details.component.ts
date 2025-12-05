import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, Output, EventEmitter, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';
import { getRandomColor } from '../../../shared/color-utils';
import { Contact } from '../../shared-data/contact.interface';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';
import { ContactDataService } from '../../shared-data/contact-data.service';
import { AuthenticationService } from '../../../auth/services/authentication.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Contact details component that displays comprehensive information about a selected contact
 * Provides functionality for viewing, editing, and deleting individual contacts
 */
@Component({
  selector: 'app-contact-details',
  imports: [CommonModule, ContactDialogComponent],
  templateUrl: './contact-details.component.html',
  styleUrl: './contact-details.component.scss',
})
export class ContactDetailsComponent implements OnInit, OnChanges, OnDestroy {
  /** Contact ID to display details for */
  @Input() contactId: string | null = null;

  /** Event emitted when edit contact is requested */
  @Output() editContactRequested = new EventEmitter<Contact>();

  /** Event emitted when delete contact is requested */
  @Output() deleteContactRequested = new EventEmitter<string>();

  /** Event emitted when back navigation is requested */
  @Output() backRequested = new EventEmitter<void>();

  /** Provides access to the toast service for UI messages */
  toastService = inject(ToastService);

  /** Observable stream of the current contact data */
  contact$!: Observable<Contact | null>;

  /** Controls animation state for component transitions */
  animated: boolean = true;

  /** Tracks if the current view is mobile layout */
  isMobileView: boolean = false;

  /** Controls visibility of edit contact dialog */
  showEditDialog: boolean = false;

  /** Flag to trigger dialog closing */
  shouldCloseDialog: boolean = false;

  /** Contact object being edited */
  contactToEdit: Contact | null = null;

  /** Controls visibility of mobile menu options */
  showMobileMenu: boolean = false;

  /** Observable indicating if the contact belongs to the current user */
  isOwnContact$!: Observable<boolean>;

  /** Reference to color utility function */
  getRandomColor = getRandomColor;

  /**
   * Constructor initializes the contact details component
   * @param {ActivatedRoute} route - Current activated route for parameter access
   * @param {Router} router - Angular router for navigation
   * @param {ContactDataService} contactDataService - Service for contact data operations
   * @param {AuthenticationService} authenticationService - Service for user authentication
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public contactDataService: ContactDataService,
    private authenticationService: AuthenticationService
  ) {
    this.checkScreenSize();
  }

  /**
   * Initializes the component and sets up contact loading
   */
  ngOnInit() {
    this.initializeContactId();
    this.setupEventListeners();
  }

  /**
   * Cleans up event listeners on component destruction
   */
  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  /**
   * Initializes contact ID from route or input
   */
  private initializeContactId() {
    if (!this.contactId) {
      this.contactId = this.route.snapshot.params['id'];
    }
    if (this.contactId) {
      this.loadContact();
    }
  }

  /**
   * Sets up window resize event listener
   */
  private setupEventListeners() {
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  /**
   * Checks screen size and updates mobile view state
   */
  private checkScreenSize() {
    this.isMobileView = window.innerWidth < 816;
    if (!this.isMobileView) {
      this.showMobileMenu = false;
    }
  }

  /**
   * Handles input changes, particularly contact ID changes
   * @param changes - SimpleChanges object containing input changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['contactId'] && this.contactId) {
      this.resetAnimation();
      this.loadContact();
      this.showMobileMenu = false;
    }
  }

  /**
   * Resets animation state for contact transitions
   */
  private resetAnimation() {
    this.animated = false;
    setTimeout(() => {
      this.animated = true;
    }, 10);
  }

  /**
   * Loads contact data by ID
   */
  private loadContact() {
    if (this.contactId) {
      this.contact$ = this.contactDataService.getContactById(this.contactId);
      this.isOwnContact$ = this.contact$.pipe(
        map((contact) => !!contact && this.authenticationService.isEmailOfCurrentUser(contact.email))
      );
    }
  }

  /**
   * Handles back navigation
   */
  goBack() {
    if (this.router.url.includes('/contacts/')) {
      this.router.navigate(['/contacts']);
    } else {
      this.backRequested.emit();
    }
  }

  /**
   * Handles contact editing based on view mode
   * @param contact - The contact to edit
   */
  editContact(contact: Contact) {
    this.closeMobileMenu();
    if (this.isMobileView && this.router.url.includes('/contacts/')) {
      this.openMobileEditDialog(contact);
    } else {
      this.editContactRequested.emit(contact);
    }
  }

  /**
   * Opens edit dialog in mobile view
   * @param contact - The contact to edit
   */
  private openMobileEditDialog(contact: Contact) {
    this.contactToEdit = contact;
    this.showEditDialog = true;
  }

  /**
   * Handles contact deletion based on view mode
   * @param contactId - The ID of the contact to delete
   */
  deleteContact(contactId: string | undefined) {
    if (!contactId) return;

    this.closeMobileMenu();
    if (this.isMobileView && this.router.url.includes('/contacts/')) {
      this.deleteMobileContact(contactId);
    } else {
      this.deleteContactRequested.emit(contactId);
    }
  }

  /**
   * Deletes contact in mobile view
   * @param contactId - The ID of the contact to delete
   */
  private deleteMobileContact(contactId: string) {
    this.contactDataService.deleteContact(contactId).then(() => {
      this.router.navigate(['/contacts']);
    });
  }

  /**
   * Toggles the mobile menu visibility
   */
  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  /**
   * Closes the mobile menu
   */
  closeMobileMenu() {
    this.showMobileMenu = false;
  }

  /**
   * Starts the dialog close process
   */
  startDialogClose() {
    this.shouldCloseDialog = true;
  }

  /**
   * Closes the edit dialog and resets state
   */
  closeDialog() {
    this.showEditDialog = false;
    this.contactToEdit = null;
    this.shouldCloseDialog = false;
  }

  /**
   * Handles contact submission from edit dialog
   * @param contactData - The updated contact data
   */
  async onContactSubmitted(contactData: Contact) {
    try {
      await this.contactDataService.updateContact(contactData);
      this.closeDialog();
      this.loadContact();
    } catch (error) {
      this.toastService.throwToast({ code: 'contact/save/error' });
    }
  }

  /**
   * Gets initials from a contact name
   * @param name - The contact name
   * @returns The initials string
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('');
  }
}
