import { Article } from '../models/Article';
import { ContentAnalysisService } from '../services/ContentAnalysisService';

/**
 * Repository for managing article data storage and retrieval
 */
export class ArticleRepository {
  private articles: Map<string, Article>;
  private contentAnalysisService: ContentAnalysisService;

  constructor(contentAnalysisService?: ContentAnalysisService) {
    this.articles = new Map();
    this.contentAnalysisService = contentAnalysisService || new ContentAnalysisService();
  }

  /**
   * Store an article in the repository
   * Automatically enriches articles with incomplete metadata
   */
  store(article: Article): void {
    // Enrich article with inferred metadata if needed
    const enrichedArticle = this.contentAnalysisService.enrichArticle(article);
    this.articles.set(enrichedArticle.id, enrichedArticle);
  }

  /**
   * Retrieve an article by ID
   */
  findById(id: string): Article | undefined {
    return this.articles.get(id);
  }

  /**
   * Retrieve all articles
   */
  findAll(): Article[] {
    return Array.from(this.articles.values());
  }

  /**
   * Search articles by category
   * Handles articles with incomplete metadata by excluding those without a category
   */
  findByCategory(category: string): Article[] {
    return Array.from(this.articles.values()).filter(
      article => article.category && article.category === category
    );
  }

  /**
   * Search articles by tags
   * Returns articles that contain at least one of the specified tags
   * Handles articles with incomplete metadata by treating missing tags as empty array
   */
  findByTags(tags: string[]): Article[] {
    if (tags.length === 0) {
      return [];
    }

    return Array.from(this.articles.values()).filter(article => {
      const articleTags = article.tags || [];
      return tags.some(tag => articleTags.includes(tag));
    });
  }

  /**
   * Check if an article has sufficient metadata for recommendations
   * Uses ContentAnalysisService to determine if article can be recommended
   */
  hasSufficientMetadata(article: Article): boolean {
    return this.contentAnalysisService.hasSufficientMetadata(article);
  }

  /**
   * Get articles suitable for recommendations (with sufficient metadata)
   * Excludes articles with insufficient metadata from recommendations
   */
  findRecommendable(): Article[] {
    return Array.from(this.articles.values()).filter(article =>
      this.hasSufficientMetadata(article)
    );
  }

  /**
   * Check if an article has incomplete metadata that should be flagged to users
   * @param article - The article to check
   * @returns true if article has incomplete metadata
   */
  hasIncompleteMetadata(article: Article): boolean {
    return this.contentAnalysisService.hasIncompleteMetadata(article);
  }

  /**
   * Clear all articles (useful for testing)
   */
  clear(): void {
    this.articles.clear();
  }
}
