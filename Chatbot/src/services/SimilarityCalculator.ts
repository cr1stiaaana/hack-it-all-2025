import { Article } from '../models/Article';
import { UserProfile } from '../models/UserProfile';

/**
 * Calculates similarity scores between articles and user preferences
 */
export class SimilarityCalculator {
  /**
   * Calculate similarity score between an article and user profile
   * Higher scores indicate better matches
   * 
   * Score components:
   * - Category match: 10 points base, multiplied by category weight from profile
   * - Tag overlap: 2 points per matching tag, multiplied by tag weight
   * - Feedback adjustment: +5 for liked similar articles, -5 for disliked
   */
  calculateSimilarityScore(article: Article, userProfile: UserProfile): number {
    let score = 0;
    
    // Category similarity with preference weighting
    const categoryWeight = userProfile.categoryWeights.get(article.category) || 0;
    if (categoryWeight > 0) {
      score += 10 * categoryWeight;
    }
    
    // Tag similarity with preference weighting
    for (const tag of article.tags) {
      const tagWeight = userProfile.preferredTags.get(tag) || 0;
      if (tagWeight > 0) {
        score += 2 * tagWeight;
      }
    }
    
    // Incorporate feedback from user's history
    score += this.calculateFeedbackAdjustment(article, userProfile);
    
    return score;
  }

  /**
   * Calculate feedback-based adjustment to similarity score
   * Looks at user's feedback on similar articles (same category or shared tags)
   */
  private calculateFeedbackAdjustment(article: Article, userProfile: UserProfile): number {
    let adjustment = 0;
    
    for (const feedback of userProfile.feedbackHistory) {
      // Find the article view that corresponds to this feedback
      const feedbackArticle = userProfile.recentArticles.find(
        a => a.articleId === feedback.articleId
      );
      
      if (!feedbackArticle) continue;
      
      // Check if the feedback article is similar to the current article
      const isSimilar = this.areArticlesSimilar(
        article.category,
        article.tags,
        feedbackArticle.category,
        feedbackArticle.tags
      );
      
      if (isSimilar) {
        if (feedback.feedbackType === 'like') {
          adjustment += 5;
        } else if (feedback.feedbackType === 'dislike') {
          adjustment -= 5;
        }
      }
    }
    
    return adjustment;
  }

  /**
   * Determine if two articles are similar based on category and tags
   */
  private areArticlesSimilar(
    category1: string,
    tags1: string[],
    category2: string,
    tags2: string[]
  ): boolean {
    // Same category makes them similar
    if (category1 === category2) {
      return true;
    }
    
    // Shared tags make them similar
    const sharedTags = tags1.filter(tag => tags2.includes(tag));
    return sharedTags.length > 0;
  }
}
