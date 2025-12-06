import { Exchange } from './Exchange';

/**
 * Represents a conversation session with context tracking
 */
export interface Session {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastActivityAt: Date;
  conversationContext: Exchange[];
  recommendedArticles: string[];
}
