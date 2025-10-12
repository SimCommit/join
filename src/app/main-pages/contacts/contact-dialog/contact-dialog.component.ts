import { Component, Output, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { ContactFormComponent } from './contact-form/contact-form.component';
import { Contact } from './../../shared-data/contact-interface';
import { CommonModule } from '@angular/common';

/**
 * Component responsible for displaying and managing the contact creation or edit dialog.
 * Handles animation, form submission, and dialog visibility.
 */
@Component({
  selector: 'app-contact-dialog',
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss',
  standalone: true,
  imports: [CommonModule, ContactFormComponent],
})
export class ContactDialogComponent implements OnInit, OnChanges, OnDestroy {
  /**
   * The contact currently being edited. If null, the form will create a new contact.
   */
  @Input() editingContact: Contact | null = null;

  /**
   * Indicates whether the dialog should automatically close.
   */
  @Input() shouldClose: boolean = false;

  /**
   * Emits the contact data when the form is submitted.
   */
  @Output() contactSubmitted = new EventEmitter<Contact>();

  /**
   * Emits an event when the dialog has been fully closed.
   */
  @Output() dialogClosed = new EventEmitter<void>();

  /**
   * Emits an event when a request to close the dialog is triggered (e.g. cancel or overlay click).
   */
  @Output() closeRequested = new EventEmitter<void>();

  /**
   * Emits an event if the closing action is canceled (e.g. user decides not to discard changes).
   */
  @Output() closeCanceled = new EventEmitter<void>();

  /**
   * Controls whether the opening/closing animation is active.
   */
  animated: boolean = false;

  /**
   * Indicates if the dialog is currently in the process of closing.
   */
  isClosing: boolean = false;

  /**
   * Detects whether the dialog is being viewed on a mobile device.
   */
  isMobile = false;

  /**
   * Initializes the dialog with animations and viewport settings
   */
  ngOnInit() {
    this.setupDialog();
    this.setupViewportListener();
  }

  /**
   * Cleans up resources when component is destroyed
   */
  ngOnDestroy(): void {
    document.body.style.overflow = '';
    window.removeEventListener('resize', this.checkViewportWidth);
  }

  /**
   * Handles input changes, particularly the shouldClose trigger
   * @param changes - The changes to component inputs
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['shouldClose'] && changes['shouldClose'].currentValue === true) {
      this.onClose();
    }
  }

  /**
   * Sets up the dialog animation and body overflow
   */
  private setupDialog() {
    this.animated = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Sets up the viewport width listener
   */
  private setupViewportListener() {
    this.checkViewportWidth();
    window.addEventListener('resize', this.checkViewportWidth);
  }

  /**
   * Checks viewport width and updates mobile state
   */
  checkViewportWidth = () => {
    this.isMobile = window.innerWidth < 1040;
  };

  /**
   * Handles contact submission with close animation
   * @param contactData - The submitted contact data
   */
  onContactSubmitted(contactData: Contact) {
    this.startCloseAnimation(() => {
      this.contactSubmitted.emit(contactData);
    });
  }

  /**
   * Handles dialog close request
   */
  onClose() {
    this.startCloseAnimation(() => {
      this.dialogClosed.emit();
    });
  }

  /**
   * Handles overlay click to close dialog
   * @param event - The mouse event
   */
  onOverlayClick(event: MouseEvent) {
    this.onClose();
  }

  /**
   * Starts the close animation and executes callback
   * @param callback - Function to execute after animation
   */
  private startCloseAnimation(callback: () => void) {
    this.isClosing = true;
    setTimeout(() => {
      callback();
    }, 300);
  }
}
