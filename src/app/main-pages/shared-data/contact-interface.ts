/**
 * Contact interface definition for contact management
 * Represents a contact entity with personal information
 */
export interface Contact {
  /** Unique identifier for the contact (optional for new contacts) */
  id?: string;

  /** Full name of the contact */
  name: string;

  /** Email address of the contact */
  email: string;

  /** Phone number of the contact */
  phone: string;
}
