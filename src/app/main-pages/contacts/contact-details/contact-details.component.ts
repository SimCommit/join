import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';
import { getRandomColor } from '../../../shared/color-utils';
import { Contacts } from '../../contacts-interface';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';
import { ContactDataService } from '../../shared-data/contact-data.service';
import { AuthenticationService } from '../../../auth/services/authentication.service';

@Component({
  selector: 'app-contact-details',
  imports: [CommonModule, ContactDialogComponent],
  templateUrl: './contact-details.component.html',
  styleUrl: './contact-details.component.scss',
})
export class ContactDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() contactId: string | null = null;
  @Output() editContactRequested = new EventEmitter<Contacts>();
  @Output() deleteContactRequested = new EventEmitter<string>();
  @Output() backRequested = new EventEmitter<void>();

  contact$!: Observable<Contacts | null>;
  animated: boolean = true;
  isMobileView: boolean = false;
  showEditDialog: boolean = false;
  shouldCloseDialog: boolean = false;
  contactToEdit: Contacts | null = null;
  showMobileMenu: boolean = false;
  isOwnContact$!: Observable<boolean>;

  getRandomColor = getRandomColor;

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
        map(
          (contact) =>
            !!contact &&
            this.authenticationService.isEmailOfCurrentUser(contact.email)
        )
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
  editContact(contact: Contacts) {
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
  private openMobileEditDialog(contact: Contacts) {
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
  async onContactSubmitted(contactData: Contacts) {
    try {
      await this.contactDataService.updateContact(contactData);
      this.closeDialog();
      this.loadContact();
    } catch (error) {
      console.error('Error updating contact:', error);
      alert(
        'Fehler beim Speichern des Kontakts. Bitte versuchen Sie es erneut.'
      );
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
