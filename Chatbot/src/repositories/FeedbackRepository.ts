import { Feedback, FeedbackType } from '../models/Feedback';

/**
 * Repository for managing user feedback on articles
 */
export class FeedbackRepository {
  private feedback: Feedback[];

  constructor() {
    this.feedback = [];
  }

  /**
   * Store user feedback on an article
   */
  store(feedback: Feedback): void {
    this.feedback.push(feedback);
  }

  /**
   * Get all feedback for a specific user
   * @param userId - The user ID
   * @returns All feedback entries for the user, sorted by most recent first
   */
  findByUser(userId: string): Feedback[] {
    return this.feedback
      .filter(f => f.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all feedback for a specific session
   * @param sessionId - The session ID
   * @returns Feedback entries for the specified session
   */
  findBySession(sessionId: string): Feedback[] {
    return this.feedback
      .filter(f => f.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all feedback for a specific user in a specific session
   * @param userId - The user ID
   * @param sessionId - The session ID
   * @returns Feedback entries for the user in the specified session
   */
  findByUserAndSession(userId: string, sessionId: string): Feedback[] {
    return this.feedback
      .filter(f => f.userId === userId && f.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get the most recent feedback for a specific article by a specific user
   * @param userId - The user ID
   * @param articleId - The article ID
   * @returns The most recent feedback entry, or undefined if none exists
   */
  findByUserAndArticle(userId: string, articleId: string): Feedback | undefined {
    const articleFeedback = this.feedback
      .filter(f => f.userId === userId && f.articleId === articleId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return articleFeedback.length > 0 ? articleFeedback[0] : undefined;
  }

  /**
   * Get all feedback of a specific type for a user
   * @param userId - The user ID
   * @param feedbackType - The type of feedback to filter by
   * @returns Feedback entries matching the specified type
   */
  findByUserAndType(userId: string, feedbackType: FeedbackType): Feedback[] {
    return this.feedback
      .filter(f => f.userId === userId && f.feedbackType === feedbackType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear all feedback (useful for testing)
   */
  clear(): void {
    this.feedback = [];
  }
}
