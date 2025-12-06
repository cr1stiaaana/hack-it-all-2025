import { Article } from '../models/Article';
import { UserProfile } from '../models/UserProfile';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { PreferenceAnalyzer } from './PreferenceAnalyzer';
import { SimilarityCalculator } from './SimilarityCalculator';

/**
 * Generates personalized article recommendations based on user preferences
 */
export class RecommendationEngine {
  constructor(
    private articleRepo: ArticleRepository,
    private preferenceAnalyzer: PreferenceAnalyzer,
    private similarityCalculator: SimilarityCalculator
  ) {}

  /**
   * Generate article recommendations for a user
   * @param userId - The user ID
   * @param count - Number of recommendations to generate (default: 3)
   * @param excludeIds - Article IDs to exclude (e.g., already recommended in session)
   * @returns Array of recommended articles, ranked by similarity score
   */
  generateRecommendations(
    userId: string,
    count: number = 3,
    excludeIds: string[] = []
  ): Article[] {
    // Build user profile from viewing history and feedback
    const userProfile = this.preferenceAnalyzer.buildUserProfile(userId);
    
    // Handle empty history with popular articles fallback
    if (userProfile.recentArticles.length === 0) {
      return this.getPopularArticles(count, excludeIds);
    }
    
    // Get all recommendable articles (with sufficient metadata)
    const candidateArticles = this.articleRepo.findRecommendable();
    
    // Filter out excluded articles and articles user has already viewed
    const viewedArticleIds = new Set(userProfile.recentArticles.map(v => v.articleId));
    const filteredCandidates = candidateArticles.filter(
      article => !excludeIds.includes(article.id) && !viewedArticleIds.has(article.id)
    );
    
    // Calculate similarity scores for each candidate
    const scoredArticles = filteredCandidates.map(article => ({
      article,
      score: this.similarityCalculator.calculateSimilarityScore(article, userProfile)
    }));
    
    // Sort by similarity score (highest first)
    scoredArticles.sort((a, b) => b.score - a.score);
    
    // Apply diversity requirement: if user has viewed only one category,
    // ensure at least one recommendation from a different category
    const recommendations = this.ensureDiversity(
      scoredArticles.map(item => item.article),
      userProfile,
      count
    );
    
    return recommendations;
  }

  /**
   * Find articles similar to a specific source article
   * @param articleId - The source article ID
   * @param count - Number of similar articles to return (default: 3)
   * @returns Array of similar articles, ranked by similarity
   */
  findSimilarArticles(articleId: string, count: number = 3): Article[] {
    const sourceArticle = this.articleRepo.findById(articleId);
    
    if (!sourceArticle) {
      return [];
    }
    
    // Get all recommendable articles except the source
    const candidateArticles = this.articleRepo
      .findRecommendable()
      .filter(article => article.id !== articleId);
    
    // Calculate similarity to source article
    const scoredArticles = candidateArticles.map(article => ({
      article,
      score: this.calculateArticleSimilarity(sourceArticle, article)
    }));
    
    // Sort by similarity score (highest first) and return top N
    scoredArticles.sort((a, b) => b.score - a.score);
    
    return scoredArticles.slice(0, count).map(item => item.article);
  }

  /**
   * Get popular articles as fallback when user has no history
   * Currently returns articles sorted by like count
   * @param count - Number of articles to return
   * @param excludeIds - Article IDs to exclude
   * @returns Array of popular articles
   */
  private getPopularArticles(count: number, excludeIds: string[]): Article[] {
    const articles = this.articleRepo
      .findRecommendable()
      .filter(article => !excludeIds.includes(article.id));
    
    // Sort by like count (highest first)
    articles.sort((a, b) => b.likeCount - a.likeCount);
    
    return articles.slice(0, count);
  }

  /**
   * Calculate similarity between two articles based on shared characteristics
   * @param source - The source article
   * @param candidate - The candidate article to compare
   * @returns Similarity score (higher is more similar)
   */
  private calculateArticleSimilarity(source: Article, candidate: Article): number {
    let score = 0;
    
    // Same category: 10 points
    if (source.category === candidate.category) {
      score += 10;
    }
    
    // Shared tags: 3 points per shared tag
    const sharedTags = source.tags.filter(tag => candidate.tags.includes(tag));
    score += sharedTags.length * 3;
    
    // Same author: 5 points
    if (source.author === candidate.author) {
      score += 5;
    }
    
    return score;
  }

  /**
   * Ensure diversity in recommendations
   * If user has viewed only one category, include at least one article from a different category
   * @param rankedArticles - Articles already ranked by similarity score
   * @param userProfile - The user's preference profile
   * @param count - Number of recommendations to return
   * @returns Array of articles with diversity ensured
   */
  private ensureDiversity(
    rankedArticles: Article[],
    userProfile: UserProfile,
    count: number
  ): Article[] {
    // Get unique categories from user's viewing history
    const viewedCategories = new Set(userProfile.recentArticles.map(v => v.category));
    
    // If user has viewed more than one category, no diversity adjustment needed
    if (viewedCategories.size !== 1) {
      return rankedArticles.slice(0, count);
    }
    
    // User has viewed only one category - ensure diversity
    const singleCategory = Array.from(viewedCategories)[0];
    
    // Separate articles by category
    const sameCategory = rankedArticles.filter(a => a.category === singleCategory);
    const differentCategory = rankedArticles.filter(a => a.category !== singleCategory);
    
    // If no articles from different categories available, return what we have
    if (differentCategory.length === 0) {
      return rankedArticles.slice(0, count);
    }
    
    // Build recommendations: include at least one from different category
    const recommendations: Article[] = [];
    
    // Add the best article from different category first
    recommendations.push(differentCategory[0]);
    
    // Fill remaining slots with best matches (could be same or different category)
    let sameIdx = 0;
    let diffIdx = 1;
    
    while (recommendations.length < count && (sameIdx < sameCategory.length || diffIdx < differentCategory.length)) {
      // Alternate or pick best remaining
      if (sameIdx < sameCategory.length) {
        recommendations.push(sameCategory[sameIdx]);
        sameIdx++;
      }
      
      if (recommendations.length < count && diffIdx < differentCategory.length) {
        recommendations.push(differentCategory[diffIdx]);
        diffIdx++;
      }
    }
    
    return recommendations.slice(0, count);
  }
}
