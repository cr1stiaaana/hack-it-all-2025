/**
 * Represents an authenticated user session
 */
export interface AuthSession {
  sessionToken: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  isValid: boolean;
}
