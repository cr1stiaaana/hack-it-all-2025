import { Article } from '../models/Article';

/**
 * Service for analyzing article content to infer missing metadata
 * Handles articles with incomplete metadata by extracting information from content
 */
export class ContentAnalysisService {
  // Common keywords for category inference
  private readonly categoryKeywords: Map<string, string[]> = new Map([
    ['Technology', ['software', 'computer', 'programming', 'code', 'algorithm', 'data', 'ai', 'machine learning', 'tech', 'digital', 'internet', 'web', 'app', 'development']],
    ['Science', ['research', 'study', 'experiment', 'scientific', 'discovery', 'theory', 'hypothesis', 'biology', 'chemistry', 'physics', 'laboratory', 'analysis']],
    ['Business', ['market', 'company', 'economy', 'finance', 'investment', 'profit', 'revenue', 'business', 'corporate', 'entrepreneur', 'startup', 'industry']],
    ['Health', ['health', 'medical', 'doctor', 'patient', 'disease', 'treatment', 'medicine', 'wellness', 'fitness', 'nutrition', 'hospital', 'clinical']],
    ['Sports', ['game', 'team', 'player', 'sport', 'match', 'championship', 'tournament', 'athlete', 'coach', 'score', 'competition', 'league']],
    ['Politics', ['government', 'election', 'policy', 'political', 'president', 'congress', 'senate', 'vote', 'legislation', 'democracy', 'campaign', 'minister']],
    ['Entertainment', ['movie', 'film', 'music', 'actor', 'celebrity', 'show', 'entertainment', 'concert', 'performance', 'album', 'artist', 'theater']],
    ['Education', ['school', 'student', 'teacher', 'education', 'learning', 'university', 'college', 'academic', 'curriculum', 'classroom', 'study', 'course']]
  ]);

  /**
   * Infer category from article content using keyword analysis
   * @param article - The article to analyze
   * @returns Inferred category or 'Uncategorized' if no match found
   */
  inferCategory(article: Article): string {
    // If article already has a category, return it
    if (article.category && article.category.trim() !== '') {
      return article.category;
    }

    // Combine title, summary, and content for analysis
    const textToAnalyze = [
      article.title || '',
      article.summary || '',
      article.content || ''
    ].join(' ').toLowerCase();

    // If no text available, return default
    if (textToAnalyze.trim() === '') {
      return 'Uncategorized';
    }

    // Count keyword matches for each category
    const categoryScores = new Map<string, number>();

    for (const [category, keywords] of this.categoryKeywords.entries()) {
      let score = 0;
      for (const keyword of keywords) {
        // Count occurrences of each keyword
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textToAnalyze.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      categoryScores.set(category, score);
    }

    // Find category with highest score
    let bestCategory = 'Uncategorized';
    let bestScore = 0;

    for (const [category, score] of categoryScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Only return inferred category if we have at least some confidence (score > 0)
    return bestScore > 0 ? bestCategory : 'Uncategorized';
  }

  /**
   * Generate a consistent identifier for articles without titles
   * Uses a combination of article ID and content preview
   * @param article - The article to generate identifier for
   * @returns A unique, consistent identifier
   */
  generateTitleFallback(article: Article): string {
    // If article has a title, return it
    if (article.title && article.title.trim() !== '') {
      return article.title;
    }

    // Generate identifier from ID and content preview
    const contentPreview = this.extractContentPreview(article);
    
    if (contentPreview) {
      return `Article ${article.id.substring(0, 8)}: ${contentPreview}`;
    }

    // Fallback to just ID if no content available
    return `Article ${article.id}`;
  }

  /**
   * Extract a short preview from article content
   * @param article - The article to extract preview from
   * @returns First few words of content or summary
   */
  private extractContentPreview(article: Article): string {
    // Try summary first
    if (article.summary && article.summary.trim() !== '') {
      const words = article.summary.trim().split(/\s+/).slice(0, 8);
      return words.join(' ') + (article.summary.split(/\s+/).length > 8 ? '...' : '');
    }

    // Fall back to content
    if (article.content && article.content.trim() !== '') {
      const words = article.content.trim().split(/\s+/).slice(0, 8);
      return words.join(' ') + (article.content.split(/\s+/).length > 8 ? '...' : '');
    }

    return '';
  }

  /**
   * Extract key themes and topics from article content
   * Returns most frequently occurring meaningful words
   * @param article - The article to analyze
   * @param topN - Number of top themes to return (default: 5)
   * @returns Array of key themes/topics
   */
  extractKeyThemes(article: Article, topN: number = 5): string[] {
    const textToAnalyze = [
      article.title || '',
      article.summary || '',
      article.content || ''
    ].join(' ').toLowerCase();

    if (textToAnalyze.trim() === '') {
      return [];
    }

    // Common stop words to exclude
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
      'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
      'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very'
    ]);

    // Extract words and count frequencies
    const words = textToAnalyze.match(/\b[a-z]{3,}\b/g) || [];
    const wordFrequency = new Map<string, number>();

    for (const word of words) {
      if (!stopWords.has(word)) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    }

    // Sort by frequency and return top N
    const sortedWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word]) => word);

    return sortedWords;
  }

  /**
   * Check if an article has sufficient metadata for recommendations
   * An article needs at least: id, category (or inferable category), and content
   * @param article - The article to check
   * @returns true if article has sufficient metadata
   */
  hasSufficientMetadata(article: Article): boolean {
    // Must have ID
    if (!article.id) {
      return false;
    }

    // Must have category or be able to infer one
    const hasCategory = article.category && article.category.trim() !== '';
    const hasContentForInference = (article.content && article.content.trim() !== '') ||
                                   (article.summary && article.summary.trim() !== '') ||
                                   (article.title && article.title.trim() !== '');

    if (!hasCategory && !hasContentForInference) {
      return false;
    }

    // Must have some content (title, summary, or content)
    const hasContent = !!(
      (article.title && article.title.trim() !== '') ||
      (article.summary && article.summary.trim() !== '') ||
      (article.content && article.content.trim() !== '')
    );

    return hasContent;
  }

  /**
   * Enrich an article with inferred metadata
   * Fills in missing category and title using content analysis
   * @param article - The article to enrich
   * @returns Enriched article with inferred metadata
   */
  enrichArticle(article: Article): Article {
    const enriched = { ...article };

    // Infer category if missing
    if (!enriched.category || enriched.category.trim() === '') {
      enriched.category = this.inferCategory(article);
      
      // Mark that category was inferred
      enriched.metadata = {
        ...enriched.metadata,
        categoryInferred: true
      };
    }

    // Generate title fallback if missing
    if (!enriched.title || enriched.title.trim() === '') {
      enriched.title = this.generateTitleFallback(article);
      
      // Mark that title was generated
      enriched.metadata = {
        ...enriched.metadata,
        titleGenerated: true
      };
    }

    return enriched;
  }

  /**
   * Check if an article has incomplete metadata that should be flagged to users
   * @param article - The article to check
   * @returns true if article has incomplete metadata
   */
  hasIncompleteMetadata(article: Article): boolean {
    return !!(
      article.metadata?.categoryInferred ||
      article.metadata?.titleGenerated ||
      !article.author ||
      !article.publicationDate ||
      !article.summary
    );
  }
}
