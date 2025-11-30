import { Contact } from './contact.interface';

/** Group of contacts indexed by an initial letter. */
export interface ContactGroup {
  /** The title or identifier of the group (e.g. "A", "B", etc.) */
  letter: string;

  /** The list of contacts that belong to this group */
  contacts: Contact[];
}
