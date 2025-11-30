import { ElementRef, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class KeyboardFocusService {
  /** List of contact input elements used for keyboard focus navigation. */
  private focusableContacts: ElementRef<HTMLInputElement>[] = [];

  /** Callback that runs when Enter is pressed on a focused contact. */
  private enterCallback?: (index: number) => void;

  /** True if the first overlay (Assigned To) is open. */
  readonly overlay1Open = signal<boolean>(false);

  /** True if the second overlay (Category) is open. */
  readonly overlay2Open = signal<boolean>(false);

  /** Index of the currently focused contact in the assign-to list. */
  readonly focusedContactIndex = signal<number>(-1);

  /** Tracks whether the global keydown listener is attached. */
  readonly listenerAttached = signal<boolean>(false);

  constructor() {}

  // #region Life Cycle
  registerKeydownListener() {
    // window.addEventListener('keydown', this.onKeyDown, { passive: false });
    if (!this.listenerAttached()) {
      document.addEventListener('keydown', this.handleKeydown.bind(this));
      this.listenerAttached.set(true);
    }
  }

  unregisterKeydownListener() {
    // window.removeEventListener('keydown', this.onKeyDown);
    if (this.listenerAttached()) {
      document.removeEventListener('keydown', this.handleKeydown.bind(this));
      this.listenerAttached.set(false);
    }
  }

  /** Registers the callback to run when Enter is pressed. */
  registerEnterCallback(callback: (index: number) => void): void {
    this.enterCallback = callback;
  }
  // #endregion

  // #region Handle Key Events
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      this.handleArrowNavigation('down');
      return;
    }

    if (event.key === 'ArrowUp') {
      this.handleArrowNavigation('up');
      return;
    }

    if (event.key === 'Enter') {
      this.handleEnter();
      return;
    }

    if (event.key === 'Escape') {
      this.handleEscape();
      return;
    }
  }

  focusNext(): void {
    const current = this.focusedContactIndex();

    // erster Fokus
    if (current === -1 && this.focusableContacts.length > 0) {
      this.applyFocus(0);
      return;
    }

    const next = current + 1;
    if (next < this.focusableContacts.length) {
      this.applyFocus(next);
    }
  }

  focusPrevious(): void {
    const current = this.focusedContactIndex();

    // bei erstem Drücken von ArrowUp ebenfalls auf 0 gehen
    if (current === -1 && this.focusableContacts.length > 0) {
      this.applyFocus(0);
      return;
    }

    const prev = current - 1;
    if (prev >= 0) {
      this.applyFocus(prev);
    }
  }

  focusCurrent(): void {
    // optional: setzt Fokus auf den aktuell ausgewählten Index
  }

  handleEnter(): void {
    const index = this.focusedContactIndex();

    if (index === -1) {
      return;
    }

    if (this.enterCallback) {
      this.enterCallback(index);
    }
  }

  handleEscape(): void {
    // Overlays schließen
    this.overlay1Open.set(false);
    this.overlay2Open.set(false);

    // Fokus zurücksetzen
    this.focusedContactIndex.set(-1);
  }

  handleArrowNavigation(direction: 'up' | 'down'): void {
    if (direction === 'down') {
      this.focusNext();
      return;
    }
    this.focusPrevious();
  }

  registerFocusableContacts(elements: ElementRef<HTMLInputElement>[]): void {
    this.focusableContacts = elements;
  }

  private applyFocus(index: number): void {
    if (index < 0 || index >= this.focusableContacts.length) {
      return;
    }

    const el = this.focusableContacts[index]?.nativeElement;
    if (!el) {
      return;
    }

    el.focus();
    this.focusedContactIndex.set(index);
  }
  // #endregoin
}
