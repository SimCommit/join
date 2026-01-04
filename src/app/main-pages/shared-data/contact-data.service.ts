import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, Observable, Observer } from 'rxjs';
import { Contact } from './../shared-data/contact.interface';
import { User } from './user.interface';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { getDocs } from 'firebase/firestore';
import { Contacts } from './contacts.data';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Service for managing contact data operations with Firebase Firestore
 * Handles CRUD operations, contact organization, and real-time updates
 */
@Injectable({
  providedIn: 'root',
})
export class ContactDataService {
  /** Firebase Firestore instance */
  private readonly firestore = inject(Firestore);

  /** Angular environment injector for dependency injection context */
  private readonly injector = inject(EnvironmentInjector);

  /** Provides access to the toast service for UI messages */
  toastService = inject(ToastService);

  /** Flag indicating if user is not in login state */
  notInLogIn: boolean = false;

  /** Controls visibility of signup button */
  signUpButtonVisible = true;

  /** Unsubscribe handle for the active Firestore listener (undefined when disconnected). */
  unsubList?: () => void;

  /**
   * Organized contact list grouped alphabetically by initial letter.
   * This structure is used for rendering and contact management in the UI.
   */
  contactList: { letter: string; contacts: Contact[] }[] = [];

  /**
   * List of existing contacts currently stored in the Firestore collection.
   * Used primarily for guest users to determine which contacts
   * already exist in the database, so they can be deleted and replaced
   * with the predefined dummy contact list.
   */
  existingContactsList: { email: string; id: string }[] = [];

  /**
   * List of all users fetched from the Firestore 'users' collection.
   * Used to identify the current user by comparing email addresses
   * and to retrieve the correct Firestore document ID for that user.
   */
  userList: { uid: string; email: string; id: string }[] = [];

  currentUserId!: string;

  /** Predefined dummy contacts used for guest users */
  initialDummyContactsList: Contact[] = Contacts;

  /** Private behavior subject for selected contact ID */
  private selectedContactIdSubject = new BehaviorSubject<string | null>(null);

  /** Observable for selected contact ID changes */
  selectedContactId$ = this.selectedContactIdSubject.asObservable();

  constructor(private authenticationService: AuthenticationService) {}

  /**
   * Loads all currently existing contacts from Firestore
   * into `existingContactsList`. Used to determine which
   * contacts should be removed before inserting the dummy data.
   */
  public async loadExistingContacts(): Promise<void> {
    this.existingContactsList = [];
    const contactsToDeleteSnap = await runInInjectionContext(this.injector, () => getDocs(this.getContactRef()));

    contactsToDeleteSnap.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const email = data['email'] as string;

      this.existingContactsList.push({ id, email });
    });
  }

  /**
   * Extracts user data from a Firestore document and adds it to `userList`.
   * @param {QueryDocumentSnapshot<DocumentData>} element - Firestore document snapshot containing user data
   */
  addUserToUserList(element: QueryDocumentSnapshot<DocumentData>): void {
    const uid = element.data()['uid'] as string;
    const email = element.data()['email'] as string;
    const id = element.id;
    this.userList.push({ uid, email, id });
  }

  /**
   * Starts the Firestore contacts listener inside Angular's injection context.
   * Idempotent: returns immediately if a listener is already active.
   * On each snapshot, resets and rebuilds the internal contact list.
   */
  async connectContactStream(): Promise<void> {
    if (this.unsubList) return;

    runInInjectionContext(this.injector, () => {
      this.unsubList = onSnapshot(this.getContactRef(), (list) => {
        this.resetContactList();
        this.processContactList(list);
      });
    });

    this.checkForRefillContacts();
  }

  /**
   * Fills the current user's Firestore contact collection with predefined dummy contacts.
   * Used primarily for guest users after a new session starts.
   * Adds all contacts from `initialDummyContactsList` and then appends the current user if available.
   * Displays an error in the console and rethrows it if any Firestore operation fails.
   */
  async fillContactsWithDummyData(): Promise<void> {
    try {
      for (const c of this.initialDummyContactsList) {
        await this.addContactToUserCollection(c.email, c.name, c.phone);
      }
      await this.addCurrentUserToContacts();
    } catch (error) {
      this.toastService.throwToast({ code: 'contact/add/dummyError' });
    }
  }

  /**
   * Adds the currently authenticated user to the Firestore contact collection.
   * Only executes if the user object exists and has both `email` and `displayName` properties.
   */
  async addCurrentUserToContacts(): Promise<void> {
    if (this.authenticationService.currentUser) {
      if (this.authenticationService.currentUser.email && this.authenticationService.currentUser.displayName)
        await this.addContactToUserCollection(this.authenticationService.currentUser.email, this.authenticationService.currentUser.displayName);
    }
  }

  /**
   * Resets the contact list with alphabetical structure
   */
  private resetContactList(): void {
    this.contactList = [];
    for (let i = 65; i <= 90; i++) {
      this.contactList.push({
        letter: String.fromCharCode(i),
        contacts: [],
      });
    }
  }

  /**
   * Processes the Firebase contact list and organizes by letter
   * @param {QuerySnapshot<DocumentData>} list - Firebase snapshot list
   */
  private processContactList(list: QuerySnapshot<DocumentData>): void {
    list.forEach((element: QueryDocumentSnapshot<DocumentData>) => {
      const contact = this.setContactObject(element.data(), element.id);
      const firstLetter = contact.name.charAt(0).toUpperCase();
      const index = this.contactList.findIndex((singleContact) => singleContact.letter === firstLetter);
      if (index !== -1) {
        this.contactList[index].contacts.push(contact);
        this.contactList[index].contacts.sort((a, b) => a.name.localeCompare(b.name));
      }
    });
  }

  /**
   * Sets the selected contact ID in the behavior subject
   * @param {string | null} contactId - The contact ID to select, or null to deselect
   */
  setSelectedContactId(contactId: string | null): void {
    this.selectedContactIdSubject.next(contactId);
  }

  /**
   * Gets the current selected contact ID
   * @returns {string | null} The currently selected contact ID or null
   */
  getSelectedContactId(): string | null {
    return this.selectedContactIdSubject.getValue();
  }

  /**
   * Stops the active Firestore contacts and user listeners if present.
   * Idempotent: safe to call multiple times; clears the unsubscribe handle
   * so a later reconnect is possible.
   */
  async disconnectContactStream(): Promise<void> {
    if (this.unsubList) {
      this.unsubList();
      this.unsubList = undefined;
    }
  }

  /**
   * Returns the Firestore collection reference for the current user's contacts.
   * Uses the current user's Firestore document ID or the guest ID if no user is logged in.
   * @returns {CollectionReference<DocumentData>} Firestore collection reference for user contacts
   */
  getContactRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, `users/${this.currentUserId}/contacts`);
  }

  /**
   * Returns the Firestore collection reference for all registered users.
   * @returns {CollectionReference<DocumentData>} Firestore collection reference for users
   */
  getUserRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, 'users');
  }

  /**
   * Returns the Firestore collection reference for the predefined dummy contacts.
   * Used as a data source for initializing guest user contact lists.
   * @returns {CollectionReference<DocumentData>} Firestore collection reference for dummy contacts
   */
  getDummyContactsRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, 'contacts');
  }

  /**
   * Gets a single document reference
   * @param {string} colId - Collection ID
   * @param {string} docId - Document ID
   * @returns {DocumentReference<DocumentData>} Firebase document reference
   */
  getSingleDocRef(colId: string, docId: string): DocumentReference<DocumentData> {
    return doc(collection(this.firestore, colId), docId);
  }

  /**
   * Creates a contact object from Firebase document data
   * @param {DocumentData} obj - Firebase document data
   * @param {string} id - Document ID
   * @returns {Contact} Contacts object
   */
  setContactObject(obj: DocumentData, id: string): Contact {
    return {
      id: id || '',
      name: obj['name'] as string,
      email: obj['email'] as string,
      phone: (obj['phone'] as string) || '',
    };
  }

  /**
   * Gets a contact by ID as an observable
   * @param {string} id - Contact ID to find
   * @returns {Observable<Contacts | null>} Observable of contact or null
   */
  getContactById(id: string): Observable<Contact | null> {
    return new Observable<Contact | null>((observer) => {
      const findAndEmitContact = this.createContactFinder(id, observer);
      return this.setupContactObserver(findAndEmitContact);
    });
  }

  /**
   * Creates a contact finder function
   * @param {string} id - Contact ID to find
   * @param {Observer<Contacts | null>} observer - Observable observer
   * @returns {() => void} Contact finder function
   */
  private createContactFinder(id: string, observer: Observer<Contact | null>): () => void {
    return () => {
      const contact = this.findContactInList(id);
      observer.next(contact || null);
    };
  }

  /**
   * Finds a contact in the contact list
   * @param {string} id - Contact ID to find
   * @returns {Contacts | undefined} Contact or undefined
   */
  private findContactInList(id: string): Contact | undefined {
    for (const group of this.contactList) {
      const contact = group.contacts.find((c) => c.id === id);
      if (contact) return contact;
    }
    return undefined;
  }

  /**
   * Sets up the contact observer with interval
   * @param {() => void} findAndEmitContact - Function to find and emit contact
   * @returns {() => void} Cleanup function
   */
  private setupContactObserver(findAndEmitContact: () => void): () => void {
    findAndEmitContact();
    const intervalId = setInterval(findAndEmitContact, 300);
    return () => clearInterval(intervalId);
  }

  /**
   * Adds a new contact to Firebase
   * @param {Contact} contactData - Contact data to add
   * @returns {Promise<void>} Promise that resolves when contact is added
   */
  async addContact(contactData: Contact): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => addDoc(this.getContactRef(), contactData));
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'contact/add/error' });
    }
  }

  /**
   * Adds a new user document to the Firestore 'users' collection.
   * Executes within Angular's injection context to ensure proper dependency handling.
   * Logs and rethrows any Firestore errors.
   *
   * @param {User} userData - User data object containing user information to store
   * @returns {Promise<void>} Promise that resolves when the user is successfully added
   */
  async addUser(userData: User): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => addDoc(this.getUserRef(), userData));
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'user/add/error' });
    }
  }

  /**
   * Adds a new contact document to the current user's Firestore contact collection.
   * Executes within Angular's injection context.
   * Accepts an optional phone number parameter (defaults to an empty string).
   * Logs and rethrows any Firestore errors.
   *
   * @param {string} email - Contact's email address
   * @param {string} name - Contact's display name
   * @param {string} [phone=''] - Contact's phone number (optional)
   * @returns {Promise<void>} Promise that resolves when the contact is successfully added
   */
  async addContactToUserCollection(email: string, name: string, phone: string = ''): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () =>
        addDoc(this.getContactRef(), {
          email: email,
          name: name,
          phone: phone,
        })
      );
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'user/add/colleciton/error' });
    }
  }

  /**
   * Deletes a contact from the Firestore database.
   * Executes within Angular's injection context and logs any errors before rethrowing them.
   * @param {string} contactId - ID of the contact to delete
   * @returns {Promise<void>} Promise that resolves when the contact has been deleted
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => deleteDoc(doc(this.getContactRef(), contactId)));
    } catch (error: unknown) {
      this.toastService.throwToast({ code: 'contact/delete/error' });
    }
  }

  /**
   * Deletes all contacts stored from the last user session.
   * Iterates through `existingContactsList` and removes each contact from Firestore.
   */
  async deleteContactsFromLastSession() {
    const list: { email: string; id: string }[] = this.existingContactsList;

    for (let i = 0; i < this.existingContactsList.length; i++) {
      await this.deleteContact(list[i].id);
    }
  }

  /**
   * Checks if the current Firestore contact collection is empty.
   * If no contacts exist, repopulates the collection with dummy data.
   *
   * @returns {Promise<void>} Promise that resolves after the contact check and refill process
   */
  async checkForRefillContacts(): Promise<void> {
    try {
      await this.loadExistingContacts();

      if (this.existingContactsList.length === 0) {
        this.fillContactsWithDummyData();
      }
    } catch (error) {
      this.toastService.throwToast({ code: 'contact/read/existingContacts/error' });
    }
  }

  /**
   * Updates an existing contact in Firebase
   * @param {Contact} contactData - Updated contact data
   * @returns {Promise<void>} Promise that resolves when contact is updated
   */
  async updateContact(contactData: Contact): Promise<void> {
    if (contactData.id === undefined) return;
    const contactDataId: string = contactData.id;
    try {
      await runInInjectionContext(this.injector, () => updateDoc(this.getSingleDocRef(`users/${this.currentUserId}/contacts`, contactDataId), this.getCleanJson(contactData)));
    } catch (err: unknown) {
      this.toastService.throwToast({ code: 'contact/update/error' });
    }
  }

  /**
   * Cleans contact object for Firebase storage
   * @param {Contact} contact - Contact object to clean
   * @returns {Omit<Contacts, 'id'> & { id?: string }} Clean contact object
   */
  getCleanJson(contact: Contact): Omit<Contact, 'id'> & { id?: string } {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
    };
  }

  /**
   * Extracts initials from display name
   * @param {string} displayName - The user's display name
   * @returns {string} Formatted initials
   */
  extractInitials(displayName: string): string {
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
}
