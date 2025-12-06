import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationEngine } from './RecommendationEngine';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { UserHistoryRepository } from '../repositories/UserHistoryRepository';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { PreferenceAnalyzer } from './PreferenceAnalyzer';
import { SimilarityCalculator } from './SimilarityCalculator';
import { Article } from '../models/Article';
import { ArticleView } from '../models/ArticleView';

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;
  let articleRepo: ArticleRepository;
  let historyRepo: UserHistoryRepository;
  let feedbackRepo: FeedbackRepository;
  let preferenceAnalyzer: PreferenceAnalyzer;
  let similarityCalculator: SimilarityCalculator;

  beforeEach(() => {
    articleRepo = new ArticleRepository();
    historyRepo = new UserHistoryRepository();
    feedbackRepo = new FeedbackRepository();
    preferenceAnalyzer = new PreferenceAnalyzer(historyRepo, feedbackRepo);
    similarityCalculator = new SimilarityCalculator();
    engine = new RecommendationEngine(articleRepo, preferenceAnalyzer, similarityCalculator);
  });

  const createArticle = (
    id: string,
    category: string,
    tags: string[],
    likeCount: number = 0
  ): Article => ({
    id,
    title: `Article ${id}`,
    author: 'Test Author',
    publicationDate: new Date(),
    category,
    summary: 'Test summary',
    content: 'Test content',
    tags,
    likeCount,
    dislikeCount: 0,
    metadata: {}
  });

  describe('generateRecommendations', () => {
    it('should return popular articles when user has no history', () => {
      // Setup: Add articles with different like counts
      articleRepo.store(createArticle('1', 'tech', ['ai'], 100));
      articleRepo.store(createArticle('2', 'tech', ['ml'], 50));
      articleRepo.store(createArticle('3', 'science', ['physics'], 75));

      const recommendations = engine.generateRecommendations('user1', 3);

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].id).toBe('1'); // Highest like count
      expect(recommendations[1].id).toBe('3');
      expect(recommendations[2].id).toBe('2');
    });

    it('should filter out excluded articles', () => {
      articleRepo.store(createArticle('1', 'tech', ['ai'], 100));
      articleRepo.store(createArticle('2', 'tech', ['ml'], 50));
      articleRepo.store(createArticle('3', 'science', ['physics'], 75));

      const recommendations = engine.generateRecommendations('user1', 3, ['1']);

      expect(recommendations).toHaveLength(2);
      expect(recommendations.find(a => a.id === '1')).toBeUndefined();
    });

    it('should filter out articles user has already viewed', () => {
      articleRepo.store(createArticle('1', 'tech', ['ai']));
      articleRepo.store(createArticle('2', 'tech', ['ml']));
      articleRepo.store(createArticle('3', 'science', ['physics']));

      // User has viewed article 1
      historyRepo.addView('user1', {
        articleId: '1',
        viewedAt: new Date(),
        category: 'tech',
        tags: ['ai']
      });

      const recommendations = engine.generateRecommendations('user1', 3);

      expect(recommendations.find(a => a.id === '1')).toBeUndefined();
      expect(recommendations.length).toBeLessThanOrEqual(2);
    });

    it('should rank articles by similarity score', () => {
      // Setup: User has viewed tech articles
      articleRepo.store(createArticle('1', 'tech', ['ai']));
      articleRepo.store(createArticle('2', 'tech', ['ml']));
      articleRepo.store(createArticle('3', 'science', ['physics']));
      articleRepo.store(createArticle('4', 'tech', ['programming']));

      historyRepo.addView('user1', {
        articleId: '1',
        viewedAt: new Date(),
        category: 'tech',
        tags: ['ai']
      });

      const recommendations = engine.generateRecommendations('user1', 3);

      // Tech articles should be ranked higher than science
      const techCount = recommendations.filter(a => a.category === 'tech').length;
      expect(techCount).toBeGreaterThan(0);
    });

    it('should return at least 3 recommendations when available', () => {
      for (let i = 1; i <= 5; i++) {
        articleRepo.store(createArticle(`${i}`, 'tech', ['ai']));
      }

      const recommendations = engine.generateRecommendations('user1', 3);

      expect(recommendations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('recommendation diversity', () => {
    it('should include at least one article from different category when user viewed only one category', () => {
      // Setup: User has only viewed tech articles
      articleRepo.store(createArticle('1', 'tech', ['ai']));
      articleRepo.store(createArticle('2', 'tech', ['ml']));
      articleRepo.store(createArticle('3', 'tech', ['programming']));
      articleRepo.store(createArticle('4', 'science', ['physics']));
      articleRepo.store(createArticle('5', 'business', ['finance']));

      // User has only viewed tech articles
      historyRepo.addView('user1', {
        articleId: '1',
        viewedAt: new Date(),
        category: 'tech',
        tags: ['ai']
      });

      const recommendations = engine.generateRecommendations('user1', 3);

      // Should have at least one non-tech article
      const nonTechArticles = recommendations.filter(a => a.category !== 'tech');
      expect(nonTechArticles.length).toBeGreaterThanOrEqual(1);
    });

    it('should not enforce diversity when user has viewed multiple categories', () => {
      // Setup articles
      articleRepo.store(createArticle('1', 'tech', ['ai']));
      articleRepo.store(createArticle('2', 'science', ['physics']));
      articleRepo.store(createArticle('3', 'tech', ['ml']));
      articleRepo.store(createArticle('4', 'tech', ['programming']));

      // User has viewed both tech and science
      historyRepo.addView('user1', {
        articleId: '1',
        viewedAt: new Date(),
        category: 'tech',
        tags: ['ai']
      });
      historyRepo.addView('user1', {
        articleId: '2',
        viewedAt: new Date(),
        category: 'science',
        tags: ['physics']
      });

      const recommendations = engine.generateRecommendations('user1', 3);

      // No specific diversity requirement - just return best matches
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle case when no articles from different category exist', () => {
      // Setup: Only tech articles available
      articleRepo.store(createArticle('1', 'tech', ['ai']));
      articleRepo.store(createArticle('2', 'tech', ['ml']));
      articleRepo.store(createArticle('3', 'tech', ['programming']));

      historyRepo.addView('user1', {
        articleId: '1',
        viewedAt: new Date(),
        category: 'tech',
        tags: ['ai']
      });

      const recommendations = engine.generateRecommendations('user1', 3);

      // Should still return recommendations even if all same category
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('findSimilarArticles', () => {
    it('should return articles with same category', () => {
      const source = createArticle('1', 'tech', ['ai', 'ml']);
      articleRepo.store(source);
      articleRepo.store(createArticle('2', 'tech', ['programming']));
      articleRepo.store(createArticle('3', 'science', ['physics']));
      articleRepo.store(createArticle('4', 'tech', ['ai']));

      const similar = engine.findSimilarArticles('1', 3);

      expect(similar.length).toBeGreaterThan(0);
      // Should prioritize articles with same category
      const techArticles = similar.filter(a => a.category === 'tech');
      expect(techArticles.length).toBeGreaterThan(0);
    });

    it('should return articles with shared tags', () => {
      const source = createArticle('1', 'tech', ['ai', 'ml']);
      articleRepo.store(source);
      articleRepo.store(createArticle('2', 'tech', ['ai']));
      articleRepo.store(createArticle('3', 'science', ['ai']));
      articleRepo.store(createArticle('4', 'tech', ['programming']));

      const similar = engine.findSimilarArticles('1', 3);

      // Articles with shared tags should be included
      const withSharedTags = similar.filter(a => 
        a.tags.some(tag => source.tags.includes(tag))
      );
      expect(withSharedTags.length).toBeGreaterThan(0);
    });

    it('should exclude the source article', () => {
      articleRepo.store(createArticle('1', 'tech', ['ai']));
      articleRepo.store(createArticle('2', 'tech', ['ai']));
      articleRepo.store(createArticle('3', 'tech', ['ml']));

      const similar = engine.findSimilarArticles('1', 3);

      expect(similar.find(a => a.id === '1')).toBeUndefined();
    });

    it('should return empty array for non-existent article', () => {
      articleRepo.store(createArticle('1', 'tech', ['ai']));

      const similar = engine.findSimilarArticles('999', 3);

      expect(similar).toEqual([]);
    });

    it('should rank by similarity score', () => {
      const source = createArticle('1', 'tech', ['ai', 'ml']);
      articleRepo.store(source);
      articleRepo.store(createArticle('2', 'tech', ['ai', 'ml'])); // Most similar
      articleRepo.store(createArticle('3', 'tech', ['ai'])); // Somewhat similar
      articleRepo.store(createArticle('4', 'science', ['physics'])); // Least similar

      const similar = engine.findSimilarArticles('1', 3);

      // Article 2 should be ranked highest (same category + 2 shared tags)
      expect(similar[0].id).toBe('2');
    });
  });
});
