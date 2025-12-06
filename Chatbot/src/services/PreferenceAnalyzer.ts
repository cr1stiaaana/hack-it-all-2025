import { UserProfile } from '../models/UserProfile';
import { ArticleView } from '../models/ArticleView';
import { UserHistoryRepository } from '../repositories/UserHistoryRepository';
import { FeedbackRepository } from '../repositories/FeedbackRepository';

/**
 * Analyzes user viewing history and feedback to build preference profiles
 */
export class PreferenceAnalyzer {
  constructor(
    private userHistoryRepo: UserHistoryRepository,
    private feedbackRepo: FeedbackRepository
  ) {}

  /**
   * Build a complete user profile from viewing history and feedback
   * Applies temporal weighting (last 30 days weighted higher)
   */
  buildUserProfile(userId: string): UserProfile {
    const recentArticles = this.userHistoryRepo.getRecentHistory(userId, 30);
    const feedbackHistory = this.feedbackRepo.findByUser(userId);
    
    const categoryWeights = this.calculateCategoryWeights(recentArticles);
    const preferredTags = this.calculateTagWeights(recentArticles);

    return {
      userId,
      categoryWeights,
      preferredTags,
      recentArticles,
      feedbackHistory
    };
  }

  /**
   * Get category preferences with frequency counts and recency-based tie-breaking
   * Returns categories sorted by preference (most preferred first)
   */
  getCategoryPreferences(userId: string): Array<{ category: string; weight: number }> {
    const recentArticles = this.userHistoryRepo.getRecentHistory(userId, 30);
    const categoryWeights = this.calculateCategoryWeights(recentArticles);
    
    return Array.from(categoryWeights.entries())
      .map(([category, weight]) => ({ category, weight }))
      .sort((a, b) => {
        // Sort by weight descending
        if (b.weight !== a.weight) {
          return b.weight - a.weight;
        }
        // Tie-breaking: find most recent article in each category
        const aRecent = this.getMostRecentViewForCategory(recentArticles, a.category);
        const bRecent = this.getMostRecentViewForCategory(recentArticles, b.category);
        return bRecent.getTime() - aRecent.getTime();
      });
  }

  /**
   * Update user profile based on feedback
   * Adjusts category and tag weights based on like/dislike feedback
   */
  updateProfileWithFeedback(
    profile: UserProfile,
    articleCategory: string,
    articleTags: string[],
    feedbackType: 'like' | 'dislike'
  ): UserProfile {
    const adjustmentFactor = feedbackType === 'like' ? 0.2 : -0.2;
    
    // Update category weight
    const currentCategoryWeight = profile.categoryWeights.get(articleCategory) || 0;
    profile.categoryWeights.set(articleCategory, currentCategoryWeight + adjustmentFactor);
    
    // Update tag weights
    for (const tag of articleTags) {
      const currentTagWeight = profile.preferredTags.get(tag) || 0;
      profile.preferredTags.set(tag, currentTagWeight + adjustmentFactor);
    }
    
    return profile;
  }

  /**
   * Calculate category weights with temporal weighting
   * Recent articles (< 30 days) are weighted higher
   */
  private calculateCategoryWeights(articles: ArticleView[]): Map<string, number> {
    const weights = new Map<string, number>();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    for (const article of articles) {
      const currentWeight = weights.get(article.category) || 0;
      
      // Apply temporal weighting: articles within last 30 days get weight 1.5, older get 1.0
      const temporalWeight = article.viewedAt >= thirtyDaysAgo ? 1.5 : 1.0;
      
      weights.set(article.category, currentWeight + temporalWeight);
    }
    
    return weights;
  }

  /**
   * Calculate tag weights from viewing history
   */
  private calculateTagWeights(articles: ArticleView[]): Map<string, number> {
    const weights = new Map<string, number>();
    
    for (const article of articles) {
      for (const tag of article.tags) {
        const currentWeight = weights.get(tag) || 0;
        weights.set(tag, currentWeight + 1);
      }
    }
    
    return weights;
  }

  /**
   * Get the most recent view date for a specific category
   */
  private getMostRecentViewForCategory(articles: ArticleView[], category: string): Date {
    const categoryArticles = articles.filter(a => a.category === category);
    if (categoryArticles.length === 0) {
      return new Date(0); // Return epoch if no articles found
    }
    
    return categoryArticles.reduce((mostRecent, article) => {
      return article.viewedAt > mostRecent ? article.viewedAt : mostRecent;
    }, categoryArticles[0].viewedAt);
  }
}
