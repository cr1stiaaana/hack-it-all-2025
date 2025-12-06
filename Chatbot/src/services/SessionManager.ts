import { Session, Exchange } from '../models';
import { v4 as uuidv4 } from 'uuid';

/**
 * Manages conversation sessions and context tracking
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly MAX_CONTEXT_SIZE = 10;

  /**
   * Create a new conversation session for a user
   * @param userId - The user ID
   * @returns The newly created session
   */
  createSession(userId: string): Session {
    const session: Session = {
      sessionId: uuidv4(),
      userId,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      conversationContext: [],
      recommendedArticles: []
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  /**
   * Retrieve an active session by ID
   * @param sessionId - The session ID
   * @returns The session if found, null otherwise
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Add an exchange to the conversation context
   * Maintains a maximum of 10 exchanges (most recent)
   * @param sessionId - The session ID
   * @param exchange - The exchange to add
   */
  addToContext(sessionId: string, exchange: Exchange): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Add the exchange to the context
    session.conversationContext.push(exchange);

    // Limit context to last 10 exchanges
    if (session.conversationContext.length > this.MAX_CONTEXT_SIZE) {
      session.conversationContext = session.conversationContext.slice(-this.MAX_CONTEXT_SIZE);
    }

    // Update last activity timestamp
    session.lastActivityAt = new Date();
  }

  /**
   * Resolve a reference to an article from the conversation context
   * Handles references like "this article", "that one", or article titles
   * @param sessionId - The session ID
   * @param reference - The reference string to resolve
   * @returns The article ID if found, null otherwise
   */
  resolveReference(sessionId: string, reference: string): string | null {
    const session = this.sessions.get(sessionId);
    
    if (!session || session.conversationContext.length === 0) {
      return null;
    }

    const normalizedRef = reference.toLowerCase().trim();

    // Handle common reference patterns
    if (normalizedRef === 'this' || normalizedRef === 'this article' || normalizedRef === 'this one') {
      // Return the most recently mentioned article
      return this.getMostRecentArticle(session);
    }

    if (normalizedRef === 'that' || normalizedRef === 'that article' || normalizedRef === 'that one') {
      // Return the second most recently mentioned article
      return this.getSecondMostRecentArticle(session);
    }

    // Search for article by title or partial title match in conversation context
    return this.searchArticleByTitle(session, normalizedRef);
  }

  /**
   * Get the most recently mentioned article from the session context
   */
  private getMostRecentArticle(session: Session): string | null {
    // Iterate through exchanges in reverse order (most recent first)
    for (let i = session.conversationContext.length - 1; i >= 0; i--) {
      const exchange = session.conversationContext[i];
      if (exchange.mentionedArticles.length > 0) {
        return exchange.mentionedArticles[exchange.mentionedArticles.length - 1];
      }
    }
    return null;
  }

  /**
   * Get the second most recently mentioned article from the session context
   */
  private getSecondMostRecentArticle(session: Session): string | null {
    let count = 0;
    
    // Iterate through exchanges in reverse order
    for (let i = session.conversationContext.length - 1; i >= 0; i--) {
      const exchange = session.conversationContext[i];
      for (let j = exchange.mentionedArticles.length - 1; j >= 0; j--) {
        count++;
        if (count === 2) {
          return exchange.mentionedArticles[j];
        }
      }
    }
    return null;
  }

  /**
   * Search for an article by title in the conversation context
   * Note: This is a simplified implementation that searches by article ID
   * In a real implementation, this would need access to the ArticleRepository
   * to match titles to IDs
   */
  private searchArticleByTitle(session: Session, titleQuery: string): string | null {
    // Collect all mentioned articles
    const mentionedArticles: string[] = [];
    
    for (const exchange of session.conversationContext) {
      mentionedArticles.push(...exchange.mentionedArticles);
    }

    // For now, we'll do a simple check if the reference matches an article ID
    // In a full implementation, this would query the ArticleRepository
    // to match titles to IDs
    for (const articleId of mentionedArticles) {
      if (articleId.toLowerCase().includes(titleQuery)) {
        return articleId;
      }
    }

    return null;
  }

  /**
   * Add an article to the list of recommended articles in the session
   * @param sessionId - The session ID
   * @param articleId - The article ID to add
   */
  addRecommendedArticle(sessionId: string, articleId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.recommendedArticles.includes(articleId)) {
      session.recommendedArticles.push(articleId);
    }
  }

  /**
   * Get all recommended articles for a session
   * @param sessionId - The session ID
   * @returns Array of article IDs
   */
  getRecommendedArticles(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session ? session.recommendedArticles : [];
  }

  /**
   * Clean up expired sessions (optional utility method)
   * @param maxAgeMs - Maximum age in milliseconds
   */
  cleanupExpiredSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = new Date().getTime();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivityAt.getTime();
      if (age > maxAgeMs) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
