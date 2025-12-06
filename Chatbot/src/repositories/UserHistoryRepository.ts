import { ArticleView } from '../models/ArticleView';

/**
 * Repository for managing user viewing history
 */
export class UserHistoryRepository {
  private history: Map<string, ArticleView[]>;

  constructor() {
    this.history = new Map();
  }

  /**
   * Add an article view to user's history
   */
  addView(userId: string, view: ArticleView): void {
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }
    
    const userHistory = this.history.get(userId)!;
    userHistory.push(view);
  }

  /**
   * Get user's complete viewing history, sorted by most recent first
   */
  getHistory(userId: string): ArticleView[] {
    const userHistory = this.history.get(userId) || [];
    return [...userHistory].sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
  }

  /**
   * Get user's viewing history with pagination
   * @param userId - The user ID
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @returns Paginated article views, sorted by most recent first
   */
  getHistoryPaginated(userId: string, page: number, pageSize: number): ArticleView[] {
    const sortedHistory = this.getHistory(userId);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return sortedHistory.slice(startIndex, endIndex);
  }

  /**
   * Get user's viewing history from the last N days
   * @param userId - The user ID
   * @param days - Number of days to look back (default: 30)
   * @returns Article views from the specified time period, sorted by most recent first
   */
  getRecentHistory(userId: string, days: number = 30): ArticleView[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const userHistory = this.history.get(userId) || [];
    return userHistory
      .filter(view => view.viewedAt >= cutoffDate)
      .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
  }

  /**
   * Get the total count of articles in user's history
   */
  getHistoryCount(userId: string): number {
    return (this.history.get(userId) || []).length;
  }

  /**
   * Clear all history (useful for testing)
   */
  clear(): void {
    this.history.clear();
  }

  /**
   * Clear history for a specific user
   */
  clearUserHistory(userId: string): void {
    this.history.delete(userId);
  }
}
