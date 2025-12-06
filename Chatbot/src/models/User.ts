/**
 * Represents a user account in the system
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt: Date;
}
