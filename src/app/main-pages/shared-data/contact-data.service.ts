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

  /** Flag indicating if user is not in login state */
  notInLogIn: boolean = false;

  /** Controls visibility of signup button */
  signUpButtonVisible = true;

  userIsReady: boolean = false;

  /** Unsubscribe handle for the active Firestore listener (undefined when disconnected). */
  unsubList?: () => void;

  unsubUserList?: () => void;

  /** Organized contact list grouped by alphabetical letters */
  contactlist: { letter: string; contacts: Contact[] }[] = [];

  userList: { email: string; id: string }[] = [];

  initialDummyContactsList: Contact[] = Contacts;

  /** Private behavior subject for selected contact ID */
  private selectedContactIdSubject = new BehaviorSubject<string | null>(null);

  /** Observable for selected contact ID changes */
  selectedContactId$ = this.selectedContactIdSubject.asObservable();

  constructor(private authenticationService: AuthenticationService) {}

  public connectStreams() {
    this.connectUserStream();
  }

  private connectUserStream(): void {
    if (this.unsubUserList) return;

    runInInjectionContext(this.injector, () => {
      this.unsubUserList = onSnapshot(this.getUserRef(), (list) => {
        list.forEach((element: QueryDocumentSnapshot<DocumentData>) => {
          const email = element.data()['email'] as string;
          const id = element.id;
          this.userList.push({ email, id });
        });
        if (!this.userIsReady) {
          this.userIsReady = true;
          this.connectContactStream();
        }
      });
    });
  }

  /**
   * Starts the Firestore contacts listener inside Angular's injection context.
   * Idempotent: returns immediately if a listener is already active.
   * On each snapshot, resets and rebuilds the internal contact list.
   */
  private async connectContactStream(): Promise<void> {
    if (this.unsubList) return;

    const userContactsRef = collection(this.firestore, `users/${this.getCurrentUserId()}/contacts`);
    const userContactSnap = await getDocs(userContactsRef);

    if (userContactSnap.size === 0) {
      await this.fillContactsWithDummyData();
    }

    runInInjectionContext(this.injector, () => {
      this.unsubList = onSnapshot(this.getContactRef(), (list) => {
        this.resetContactList();
        this.processContactList(list);
      });
    });
  }

  async fillContactsWithDummyData(): Promise<void> {
    try {
      for (const c of this.initialDummyContactsList) {
        await this.addContactToUserCollection(c.email, c.name, c.phone);
      }

      if (this.authenticationService.currentUser) {
        if (this.authenticationService.currentUser.email && this.authenticationService.currentUser.displayName)
          await this.addContactToUserCollection(
            this.authenticationService.currentUser.email,
            this.authenticationService.currentUser.displayName
          );
      }
    } catch (error) {
      console.log('Failed to upload dummy data to firestore ', error);
    }
  }

  // id for guest account = 7PMzKYXI38pcWcJGD5QA
  getCurrentUserId(): string | void {
    let id: string = '7PMzKYXI38pcWcJGD5QA';
    let user: { email: string; id: string } | undefined;

    if (this.authenticationService.currentUser === null) return id;

    const emailCurrentUser = this.authenticationService.currentUser.email;
    user = this.userList.find((u) => u.email === emailCurrentUser);

    if (user === undefined) return id;

    id = user.id;
    return id;
  }

  /**
   * Resets the contact list with alphabetical structure
   */
  private resetContactList(): void {
    this.contactlist = [];
    for (let i = 65; i <= 90; i++) {
      this.contactlist.push({
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
      const index = this.contactlist.findIndex((singleContact) => singleContact.letter === firstLetter);
      if (index !== -1) {
        this.contactlist[index].contacts.push(contact);
        this.contactlist[index].contacts.sort((a, b) => a.name.localeCompare(b.name));
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
   * Stops the active Firestore contacts listener if present.
   * Idempotent: safe to call multiple times; clears the unsubscribe handle
   * so a later reconnect is possible.
   */
  disconnectContactStream(): void {
    if (this.unsubList) {
      this.unsubList();
      this.unsubList = undefined;
    }

    if (this.unsubUserList) {
      this.unsubUserList();
      this.unsubUserList = undefined;
      this.userIsReady = false;
    }
  }

  /**
   * Gets the Firebase contacts collection reference
   * @returns Firebase collection reference for contacts
   */
  getContactRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, `users/${this.getCurrentUserId()}/contacts`);
  }

  getUserRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, 'users');
  }

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
    for (const group of this.contactlist) {
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
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  async addUser(userData: User): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => addDoc(this.getUserRef(), userData));
    } catch (error: unknown) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async addContactToUserCollection(email: string, name: string, phone: string = ''): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () =>
        addDoc(this.getContactRef(), {
          email: email,
          name: name,
          phone: phone,
        })
      );
      // console.log('Hello from ContactData addContactToUserCollection');
    } catch (error: unknown) {
      console.error('Error adding collection to user: ', error);
      throw error;
    }
  }

  /**
   * Deletes a contact from Firebase
   * @param {string} contactId - ID of contact to delete
   * @returns {Promise<void>} Promise that resolves when contact is deleted
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => deleteDoc(doc(this.getContactRef(), contactId)));
    } catch (error: unknown) {
      console.error('Error deleting contact:', error);
      throw error;
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
      await runInInjectionContext(this.injector, () =>
        updateDoc(
          this.getSingleDocRef(`users/${this.getCurrentUserId()}/contacts`, contactDataId),
          this.getCleanJson(contactData)
        )
      );
    } catch (err: unknown) {
      console.error('Error updating contact:', err);
      throw err;
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
