import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  Renderer2,
} from '@angular/core';
import { ContactDataService } from '../../shared-data/contact-data.service';
import { getRandomColor } from '../../../shared/color-utils';
import { Contact } from '../../shared-data/contact.interface';
import { FormsModule, NgForm } from '@angular/forms';
import { BoardStatus, Subtask, Task, TaskImage } from '../../shared-data/task.interface';
import { TaskDataService } from '../../shared-data/task-data.service';
import { Router } from '@angular/router';
import { FileUploadComponent } from "../file-upload/file-upload.component";

interface ContactGroup {
  /** The title or identifier of the group (e.g. "A", "B", etc.) */
  letter: string;

  /** The list of contacts that belong to this group */
  contacts: Contact[];
}

/**
 * Component for creating a new task.
 *
 * Allows users to input task details such as title, description, due date, category, priority,
 * assigned contacts, and subtasks. Supports overlays for contact assignment and category selection,
 * form validation, and dynamic UI behavior for better user experience.
 *
 * Emits an event to close the overlay after successful submission.
 */
@Component({
  selector: 'app-task-create-form',
  imports: [CommonModule, FormsModule, FileUploadComponent],
  templateUrl: './task-create-form.component.html',
  styleUrls: ['./task-create-form.component.scss', './task-create-form.overlay.scss'],
})
export class TaskCreateFormComponent {
  /**
   * Utility function for generating a random color.
   */
  getRandomColor = getRandomColor;

  /**
   * Controls the visibility of the first overlay (e.g., contact assignment).
   */
  public isOverlayOpen1: boolean = false;

  /**
   * Controls the visibility of the second overlay (e.g., category selection).
   */
  public isOverlayOpen2: boolean = false;

  @ViewChild('taskForm') taskForm!: NgForm;

  @ViewChildren('contactRef') contactsForAssign!: QueryList<ElementRef<HTMLInputElement>>;

  @ViewChild('assignedToInput') assignedToInput!: ElementRef<HTMLInputElement>;

  @ViewChild('overlayMenu') overlayMenu!: ElementRef<HTMLDivElement>;

  @ViewChild('categoryTechnicalTaskRef') categoryTechnicalTaskRef!: ElementRef<HTMLInputElement>;

  @ViewChild('categoryUserStoryRef') categoryUserStoryRef!: ElementRef<HTMLInputElement>;

  currentFocusedContact?: ElementRef<HTMLInputElement>;

  /**
   * Indicates whether overlay2 was previously open.
   */
  overlay2WasOpen: boolean = false;

  /**
   * Selected priority level for the task.
   * Can be 'urgent', 'medium', or 'low'.
   */
  priority: 'urgent' | 'medium' | 'low' = 'medium';

  /**
   * List of contacts assigned to the task.
   */
  assignetTo: Contact[] = [];

  /**
   * Title of the task.
   */
  title: string = '';

  /**
   * Selected due date of the task.
   */
  date: Date | null = null;

  /**
   * Selected category for the task.
   */
  category: string = 'Select task category';

  /**
   * Flag to show a validation error when no category is selected.
   */
  showCategoryError: boolean = false;

  /**
   * Holds the input value for a new subtask.
   */
  addSubtask: string = '';

  /**
   * Indicates if the subtask input field is currently focused.
   */
  subtaskInputFocus: boolean = false;

  /**
   * List of all subtasks added to the task.
   */
  subtasks: Subtask[] = [];

  /**
   * List of all subtasks added to the task.
   */
  images: TaskImage[] = [];
  
  invalidFiles: File[] = [];

  /**
   * Description of the task.
   */
  description: string = '';

  /**
   * Input used for editing a subtask's title.
   */
  subtasksInput: string = '';

  /**
   * Index of the currently edited subtask, or null if none.
   */
  changeSubtask: number | null = null;

  /**
   * Minimum allowed date for the date picker (usually today).
   */
  minDate: string = '';

  /**
   * Search term used to filter contacts during assignment.
   */
  contactSearchTerm: string = '';

  /**
   * Task status that determines which board column it belongs to (e.g., 'todo', 'inProgress', 'done').
   * This is passed in as an input to the component.
   */
  @Input() taskStatus: BoardStatus = 'todo';

  /**
   * Indicates whether the task is being created from the board view.
   * This affects certain UI behaviors.
   */
  @Input() openFromBoard: boolean = false;

  /**
   * Emits a boolean value when the add-task overlay should be closed.
   */
  @Output() closeAddTaskOverlay = new EventEmitter<boolean>();

  /**
   * Constructs the component and injects required services.
   *
   * @param contactDataService - Service for managing and accessing contact data.
   * @param taskDataService - Service for managing and accessing task-related data.
   * @param router - Angular Router used for navigation.
   * @param cdr - ChangeDetectorRef used to manually trigger change detection.
   */
  constructor(
    public contactDataService: ContactDataService,
    private taskDataService: TaskDataService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {}

  // #region Lifecycle
  /**
   * Lifecycle hook that is called after the component has been initialized.
   * Calls `getTodayAsSting()` to initialize today's date as a string.
   */
  ngOnInit(): void {
    this.getTodayAsSting();
    this.initContactDataService();
    this.initListeners();
  }

  initContactDataService(): void {
    this.contactDataService.connectStreams();
  }
  // #endregion

  // #region Input Listeners
  initListeners() {
    this.listenerAssignedTo();
  }

  listenerAssignedTo() {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
  }

  onKeyDown = (event: KeyboardEvent): void => {
    // Overlay 1
    if (event.key === 'ArrowDown' && this.isOverlayOpen1) {
      event.preventDefault();
      this.nextContact();
    }

    if (
      event.key === 'Tab' &&
      this.isOverlayOpen1 &&
      (document.activeElement != this.assignedToInput.nativeElement || event.shiftKey === true)
    ) {
      this.isOverlayOpen1 = false;
    }

    if (event.key === 'ArrowUp' && this.isOverlayOpen1) {
      event.preventDefault();
      this.previousContact();
    }

    if (event.key === 'Escape' && this.isOverlayOpen1) {
      event.preventDefault();
      this.toggleOverlay1();
    }

    // Overlay 2
    if (event.key === 'ArrowDown' && this.isOverlayOpen2 && document.activeElement) {
      event.preventDefault();
      if (document.activeElement === this.categoryTechnicalTaskRef.nativeElement) {
        this.categoryUserStoryRef.nativeElement.focus();
      } else {
        this.categoryTechnicalTaskRef.nativeElement.focus();
      }
    }

    if (event.key === 'ArrowUp' && this.isOverlayOpen2 && document.activeElement) {
      event.preventDefault();
      if (document.activeElement === this.categoryUserStoryRef.nativeElement) {
        this.categoryTechnicalTaskRef.nativeElement.focus();
      } else {
        this.categoryUserStoryRef.nativeElement.focus();
      }
    }

    if (event.key === 'Tab' && this.isOverlayOpen2) {
      this.toggleOverlay2();
    }

    if (event.key === 'Escape' && this.isOverlayOpen2) {
      event.preventDefault();
      this.toggleOverlay2();
    }

    /**
     * Logs the currently focused element to the console.
     * Useful for debugging and testing focus behavior.
     */ // if (event.key === 'o') {
    //   event.preventDefault();
    //   setInterval(() => {
    //     console.log('active: ', document.activeElement);
    //   }, 2000);
    // }
  };
  // #endregion

  // #region Custom Focus Handlers
  focusContact() {
    this.contactsForAssign.toArray().forEach((e) => {
      e.nativeElement.classList.remove('inFocus');
    });

    this.renderer.addClass(document.activeElement, 'inFocus');
  }

  nextContact() {
    if (this.contactsForAssign.toArray().length <= 0) return;

    let contactsArray = this.contactsForAssign.toArray();
    let newIndex: number;

    // Setzt currentFocusedContact auf ersten Contact im Array, falls undefined
    // und newIndex auf -1, damit er später 0 ist
    if (!this.currentFocusedContact) {
      this.currentFocusedContact = contactsArray[0];
      newIndex = -1;
    } else {
      newIndex = contactsArray.indexOf(this.currentFocusedContact);
      this.currentFocusedContact.nativeElement.blur();
    }

    // zählt Index eins hoch, falls noch nicht das letzte Element im Array ausgewählt ist
    if (newIndex < contactsArray.length - 1) {
      newIndex = newIndex + 1;
    }

    this.currentFocusedContact = contactsArray[newIndex];
    this.currentFocusedContact.nativeElement.focus();
  }

  previousContact() {
    if (this.contactsForAssign.toArray().length <= 0) return;

    let contactsArray = this.contactsForAssign.toArray();
    let newIndex: number;

    // Setzt currentFocusedContact auf letzten Contact im Array, falls undefined
    // und newIndex auf Länge des Array, damit er später der Position des letzten Contacts entspricht
    if (!this.currentFocusedContact) {
      this.currentFocusedContact = contactsArray[contactsArray.length - 1];
      newIndex = contactsArray.length;
    } else {
      newIndex = contactsArray.indexOf(this.currentFocusedContact);
      this.currentFocusedContact.nativeElement.blur();
    }

    // zählt Index eins runter, falls noch nicht erste letzte Element im Array ausgewählt ist
    if (newIndex > 0) {
      newIndex = newIndex - 1;
    }

    this.currentFocusedContact = contactsArray[newIndex];
    this.currentFocusedContact.nativeElement.focus();
  }

  handleOverlay2InFocus(event: Event) {
    this.toggleOverlay('category', event);
    // this.categoryTechnicalTaskRef.nativeElement.focus();
    this.overlayMenu.nativeElement.focus();
  }
  // #endregion

  /**
   * Toggles the visibility of the specified overlay ('assign' or 'category') based on user interaction.
   * Stops event propagation to prevent unintended side effects from parent elements.
   *
   * - If the `type` is `'assign'`, it triggers `toggleOverlay1()`.
   * - If the `type` is `'category'`, it checks whether the second overlay was previously closed
   *   and sets a flag before calling `toggleOverlay2()`.
   *
   * @param {'assign' | 'category'} type - The type of overlay to toggle.
   * @param {Event} event - The DOM event that triggered this action (e.g., a click).
   */
  toggleOverlay(type: 'assign' | 'category', event: Event) {
    event.stopPropagation();
    if (this.isTypeAssign(type)) {
      this.toggleOverlay1();
    } else if (type === 'category') {
      if (this.isOverlayOpen2 == false) {
        this.overlay2WasOpen = true;
      }
      this.toggleOverlay2();
    }
  }

  /**
   * Gets filtered contacts based on search term
   * @returns Filtered contact list
   */
  getFilteredContacts(): ContactGroup[] {
    if (this.isContactListEmpty()) {
      return [];
    }

    if (this.isSearchTermEmpty()) {
      return this.contactDataService.contactList;
    }

    const searchTerm = this.contactSearchTerm.toLowerCase();

    const filteredGroups = this.contactDataService.contactList
      .map((group) => this.filterGroupBySearchTerm(group, searchTerm))
      .filter((group) => group.contacts.length > 0);

    return filteredGroups;
  }

  /**
   * Checks if the contact list is empty or undefined.
   * @returns true if contact list is missing or empty.
   */
  private isContactListEmpty(): boolean {
    return !this.contactDataService.contactList || this.contactDataService.contactList.length === 0;
  }

  /**
   * Checks if the search term is empty or whitespace.
   * @returns true if search term is empty.
   */
  private isSearchTermEmpty(): boolean {
    return !this.contactSearchTerm || !this.contactSearchTerm.trim();
  }

  /**
   * Filters a group of contacts by search term.
   * @param group The contact group to filter.
   * @param searchTerm The lowercased search term.
   * @returns The group with only matching contacts.
   */
  private filterGroupBySearchTerm(group: ContactGroup, searchTerm: string): ContactGroup {
    const filteredContacts = group.contacts.filter(
      (contact) => contact.name.toLowerCase().includes(searchTerm) || contact.email.toLowerCase().includes(searchTerm)
    );

    return {
      ...group,
      contacts: filteredContacts,
    };
  }

  /**
   * Clears the contact search term
   */
  clearContactSearch(): void {
    this.contactSearchTerm = '';
  }

  /**
   * Handles search input changes
   */
  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.contactSearchTerm = input.value;
    this.cdr.detectChanges();
  }

  /**
   * Checks if a contact is currently assigned
   * @param contact - The contact to check
   * @returns True if contact is assigned, false otherwise
   */
  isContactAssigned(contact: Contact): boolean {
    return this.assignetTo.some((c) => c.id === contact.id);
  }

  /**
   * Updates the task priority to the given value.
   *
   * @param priority - The priority level to set. Defaults to 'medium'.
   *                   Can be 'urgent', 'medium', or 'low'.
   */
  changePriority(priority: 'urgent' | 'medium' | 'low' = 'medium') {
    this.priority = priority;
  }

  /**
   * Toggles the selection state of a contact for task assignment.
   * If the contact is not yet selected, it will be added to the `assignetTo` array.
   * If the contact is already selected, it will be removed.
   *
   * @param contact - The contact to be selected or deselected.
   * @param event - The click event used to prevent propagation.
   */
  selectContact(contact: Contact, event: Event) {
    event.stopPropagation();
    const index = this.assignetTo.findIndex((c) => c.id === contact.id);
    if (index === -1) {
      this.assignetTo.push(contact);
    } else {
      this.assignetTo.splice(index, 1);
    }
  }

  /**
   * Closes both overlay windows (overlay 1 and overlay 2).
   * If no category was selected and the category overlay was previously open,
   * an error flag (`showCategoryError`) will be set to true.
   */
  closeWindow() {
    this.isOverlayOpen1 = false;
    this.isOverlayOpen2 = false;
    if (this.category == 'Select task category' && this.overlay2WasOpen) {
      this.showCategoryError = true;
    }
  }

  /**
   * Prevents the click event from propagating to parent elements.
   *
   * This is typically used to prevent closing modals or overlays
   * when clicking inside their wrapper/container.
   *
   * @param event - The click event to stop from propagating.
   */
  onWrapperClick(event: Event) {
    event.stopPropagation();
  }

  /**
   * Sets the selected task category and closes the category overlay.
   *
   * Also resets any previous error message related to category selection.
   *
   * @param category - The category name selected by the user.
   */
  selectCategory(category: string) {
    this.category = category;
    this.isOverlayOpen2 = false;
    this.showCategoryError = false;
  }

  onSubtaskEnter(event: Event): void {
    event.preventDefault();
    this.addSubtaskToArray();
  }

  /**
   * Adds a new subtask to the subtasks array if the input is not empty.
   *
   * Uses the `getSubtask()` method to generate the subtask object,
   * then clears the input field after successful addition.
   */
  addSubtaskToArray() {
    if (this.addSubtask != '') {
      this.subtasks.push(this.getSubtask());
      this.addSubtask = '';
    }
  }

  /**
   * Opens the subtask input field for editing at the specified index.
   *
   * Sets the `changeSubtask` index to track the currently edited subtask,
   * and initializes the input field with the current subtask title.
   *
   * @param {number} index - The index of the subtask to edit.
   */
  openSubtaskInput(index: number) {
    this.changeSubtask = index;
    this.subtasksInput = this.subtasks[index].title;
  }

  /**
   * Updates the title of the subtask at the specified index with the current input value.
   * Afterwards, it resets the editing state by clearing the `changeSubtask` index.
   *
   * @param {number} index - The index of the subtask to update.
   */
  changeSubtaskTitle(index: number) {
    this.subtasks[index].title = this.subtasksInput;
    this.changeSubtask = null;
  }

  /**
   * Deletes the subtask at the specified index from the subtasks array
   * and resets the editing state by clearing the `changeSubtask` index.
   *
   * @param {number} index - The index of the subtask to delete.
   */
  deleteSubtask(index: number) {
    this.subtasks.splice(index, 1);
    this.changeSubtask = null;
  }

  /**
   * Creates a new subtask object with a unique ID, the current `addSubtask` title,
   * and a default completion status of false.
   *
   * @returns {Subtask} The newly created subtask.
   */
  getSubtask(): Subtask {
    const id = Date.now().toString();
    return {
      id: id,
      title: this.addSubtask,
      completed: false,
    };
  }

  updateImages(images: TaskImage[]): void {
    this.images = images;
  }

  /**
   * Returns an array of names for all assigned users.
   *
   * @returns {string[]} Array of assigned users' names.
   */
  getAssignedUser(): string[] {
    return this.assignetTo.map((n) => this.getName(n));
  }

  /**
   * Returns the name of the given contact.
   *
   * @param {Contact} n - The contact object.
   * @returns {string} The name of the contact.
   */
  getName(n: Contact): string {
    return n.name;
  }

  /**
   * Creates and returns a new Task object with the current task details.
   *
   * @returns {Task} A new Task object containing the current title, description, category, priority, status,
   * assigned users, creation date, due date, and subtasks.
   */
  getCleanTask(): Task {
    return {
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.taskStatus,
      assignedUsers: this.getAssignedUser(),
      createdDate: new Date(),
      dueDate: this.getDate(),
      subtasks: this.subtasks,
      images: this.images,
    };
  }

  /**
   * Returns the date value as a Date object if available.
   * If the stored date is already a Date instance, it is returned directly.
   * If the stored date is a string or other format, it is converted to a Date object.
   * Returns undefined if no date is set.
   *
   * @returns {Date | undefined} The date as a Date object, or undefined if no date is set.
   */
  getDate() {
    if (this.date != null) {
      if (this.date instanceof Date) return this.date;
      return new Date(this.date);
    }
    return undefined;
  }

  /**
   * Submits the task form if a valid category is selected.
   * - If the category is not the default 'Select task category', creates a clean task,
   *   adds it to the task data service, opens the board view, and closes the add task overlay.
   * - If the category is not selected (default), sets flags to show the category error and mark the overlay as opened.
   */
  submitTaskFromForm(): void {
    if (this.category != 'Select task category') {
      let task = this.getCleanTask();
      this.taskDataService.addTask(task);
      this.openBoard();
      this.colseAddTaskOverlayBoard();
    } else {
      this.overlay2WasOpen = true;
      this.showCategoryError = true;
    }
  }

  checkForErrors(): void {
    if (this.category === 'Select task category') {
      this.showCategoryError = true;
    }

    if (this.taskForm.controls['title'].invalid) {
      this.taskForm.controls['title'].markAsTouched();
    }

    if (this.taskForm.controls['date'].invalid) {
      this.taskForm.controls['date'].markAsTouched();
    }
  }

  /**
   * Navigates the application to the board page.
   */
  openBoard() {
    this.router.navigateByUrl('/board');
  }

  /**
   * Resets the task form and all related component data to their initial state.
   *
   * - Clears assigned users and subtasks.
   * - Resets category and priority selections to default values.
   * - Hides any active validation or overlay indicators.
   * - Uses `resetForm()` to restore Angular form states (`pristine`, `untouched`, etc.).
   */
  clearData(): void {
    this.assignetTo = [];
    this.category = 'Select task category';
    this.showCategoryError = false;
    this.overlay2WasOpen = false;
    this.subtasks = [];
    this.images = [];
    this.invalidFiles = [];
    
    setTimeout((): void => {
      this.taskForm.resetForm({ priority: 'medium' });
    }, 0);
  }

  /**
   * Emits an event to close the "Add Task" overlay in the board component.
   * Sends a boolean value `false` to indicate the overlay should be closed.
   */
  colseAddTaskOverlayBoard() {
    this.closeAddTaskOverlay.emit(false);
  }

  /**
   * Opens the first dropdown overlay and stops the event from propagating further.
   *
   * @param event - The DOM event triggered when opening the dropdown.
   */
  openDropdown(event: Event) {
    event.stopPropagation();
    this.isOverlayOpen1 = true;
  }

  /**
   * Sets the minDate property to today's date as a string in 'YYYY-MM-DD' format.
   */
  getTodayAsSting(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  /**
   * Toggles the visibility of the first overlay.
   * When toggling, it also ensures the second overlay is closed.
   */
  toggleOverlay1(): void {
    this.isOverlayOpen1 = !this.isOverlayOpen1;
    this.isOverlayOpen2 = false;
  }

  /**
   * Toggles the visibility of the first overlay.
   * When toggling, it also ensures the second overlay is closed.
   */
  openOverlay1(): void {
    this.isOverlayOpen1 = true;
    this.isOverlayOpen2 = false;
  }

  /**
   * Checks if the given type is 'assign'.
   *
   * @param type - The type to check, either 'assign' or 'category'.
   * @returns True if the type is 'assign', otherwise false.
   */
  isTypeAssign(type: 'assign' | 'category'): boolean {
    return type === 'assign';
  }

  /**
   * Toggles the visibility of the second overlay.
   * Also ensures the first overlay is closed.
   */
  toggleOverlay2(): void {
    this.isOverlayOpen2 = !this.isOverlayOpen2;
    this.isOverlayOpen1 = false;
  }
}
