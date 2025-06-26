import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ContactListComponent } from './contact-list/contact-list.component';
import { ContactDetailsComponent } from './contact-details/contact-details.component';
import { ContactDialogComponent } from './contact-dialog/contact-dialog.component';
import { ContactDataService } from '../contact-data.service';
import { Contacts } from '../contacts-interface';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-contacts',
  imports: [ContactListComponent, ContactDetailsComponent, ContactDialogComponent],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss'
})
export class ContactsComponent implements OnInit, OnDestroy {
  selectedContactId: string | null = null;
  showAddDialog: boolean = false;
  editingContact: Contacts | null = null;
  shouldCloseDialog: boolean = false;
  isMobileView: boolean = false;

  private readonly MOBILE_BREAKPOINT = 816;

  constructor(
    private contactDataService: ContactDataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Initializes the component and sets up event listeners
   */
  ngOnInit() {
    this.checkScreenSize();
    this.setupEventListeners();
    this.setupRouterSubscription();
  }

  /**
   * Cleans up event listeners on component destruction
   */
  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  /**
   * Sets up window resize listener and initial selection check
   */
  private setupEventListeners() {
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    setTimeout(() => this.checkForSavedSelection(), 100);
  }

  /**
   * Sets up router navigation event subscription
   */
  private setupRouterSubscription() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/contacts') {
        setTimeout(() => this.checkForSavedSelection(), 50);
      }
    });
  }

  /**
   * Checks screen size and handles mobile/desktop view transitions
   */
  private checkScreenSize() {
    const wasInMobileView = this.isMobileView;
    this.isMobileView = window.innerWidth < this.MOBILE_BREAKPOINT;
    this.handleViewModeChange(wasInMobileView);
  }

  /**
   * Handles changes between mobile and desktop view modes
   * @param wasInMobileView - Previous mobile view state
   */
  private handleViewModeChange(wasInMobileView: boolean) {
    if (wasInMobileView && !this.isMobileView && this.router.url.includes('/contacts/')) {
      this.navigateFromMobileToDesktop();
    }
  }

  /**
   * Handles navigation from mobile to desktop view
   */
  private navigateFromMobileToDesktop() {
    const contactId = this.router.url.split('/').pop();
    this.router.navigate(['/contacts']).then(() => {
      this.selectedContactId = contactId || null;
      Promise.resolve().then(() => this.cdr.detectChanges());
    });
  }

  /**
   * Checks for saved contact selection in localStorage or service
   */
  private checkForSavedSelection() {
    const savedContactId = localStorage.getItem('selectedContactId');
    if (savedContactId) {
      this.handleSavedContactId(savedContactId);
      return;
    }
    this.handleServiceContactId();
  }

  /**
   * Handles saved contact ID from localStorage
   * @param savedContactId - The saved contact ID
   */
  private handleSavedContactId(savedContactId: string) {
    this.selectedContactId = savedContactId;
    this.cdr.detectChanges();
    setTimeout(() => localStorage.removeItem('selectedContactId'), 200);
  }

  /**
   * Handles contact ID from the service
   */
  private handleServiceContactId() {
    const serviceContactId = this.contactDataService.getSelectedContactId();
    if (serviceContactId) {
      this.selectedContactId = serviceContactId;
      this.contactDataService.setSelectedContactId(null);
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles contact selection based on view mode
   * @param contactId - The selected contact ID
   */
  onContactSelected(contactId: string) {
    if (this.isMobileView) {
      this.router.navigate(['/contacts', contactId]);
    } else {
      this.selectedContactId = contactId;
      localStorage.setItem('selectedContactId', contactId);
    }
  }

  /**
   * Handles back button request
   */
  onBackRequested() {
    this.selectedContactId = null;
  }

  /**
   * Opens the add contact dialog
   */
  openAddContactDialog() {
    this.editingContact = null;
    this.showAddDialog = true;
  }

  /**
   * Opens the edit contact dialog
   * @param contact - The contact to edit
   */
  openEditContactDialog(contact: Contacts) {
    this.editingContact = contact;
    this.showAddDialog = true;
  }

  /**
   * Starts the dialog close process
   */
  startDialogClose() {
    this.shouldCloseDialog = true;
  }

  /**
   * Closes the dialog and resets state
   */
  closeDialog() {
    this.showAddDialog = false;
    this.editingContact = null;
    this.shouldCloseDialog = false;
  }

  /**
   * Handles contact submission (add or update)
   * @param contactData - The contact data to submit
   */
  async onContactSubmitted(contactData: Contacts) {
    try {
      if (this.editingContact) {
        await this.contactDataService.updateContact(contactData);
      } else {
        await this.contactDataService.addContact(contactData);
      }
      this.closeDialog();
    } catch (error) {
      this.handleContactError(error, 'saving');
    }
  }

  /**
   * Deletes a contact
   * @param contactId - The ID of the contact to delete
   */
  async deleteContact(contactId: string) {
    try {
      await this.contactDataService.deleteContact(contactId);
      if (this.selectedContactId === contactId) {
        this.selectedContactId = null;
      }
    } catch (error) {
      this.handleContactError(error, 'deleting');
    }
  }

  /**
   * Handles contact operation errors
   * @param error - The error object
   * @param operation - The operation that failed
   */
  private handleContactError(error: any, operation: string) {
    console.error(`Error ${operation} contact:`, error);
    alert(`Fehler beim ${operation === 'saving' ? 'Speichern' : 'Löschen'} des Kontakts. Bitte versuchen Sie es erneut.`);
  }
}
