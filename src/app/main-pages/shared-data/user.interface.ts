/**
 * user interface definition for user management
 * Represents a user entity with personal information
 */
export interface User {
  /** Unique identifier for the user (optional for new users) */
  id?: string;

  /** Full name of the user */
  name: string;

  /** Email address of the user */
  email: string;
}