import { describe, it, expect } from 'vitest';
import { SimilarityCalculator } from './SimilarityCalculator';
import { Article } from '../models/Article';
import { UserProfile } from '../models/UserProfile';

describe('SimilarityCalculator', () => {
  const calculator = new SimilarityCalculator();

  describe('calculateSimilarityScore', () => {
    it('should give higher scores to articles in preferred categories', () => {
      const article: Article = {
        id: 'a1',
        title: 'Test Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: ['AI'],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const profile: UserProfile = {
        userId: 'user1',
        categoryWeights: new Map([['Technology', 2.0]]),
        preferredTags: new Map([['AI', 1.0]]),
        recentArticles: [],
        feedbackHistory: []
      };

      const score = calculator.calculateSimilarityScore(article, profile);
      
      // Should get 10 * 2.0 (category) + 2 * 1.0 (tag) = 22
      expect(score).toBe(22);
    });

    it('should give zero score for articles with no matching preferences', () => {
      const article: Article = {
        id: 'a1',
        title: 'Test Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Sports',
        summary: 'Summary',
        content: 'Content',
        tags: ['Football'],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const profile: UserProfile = {
        userId: 'user1',
        categoryWeights: new Map([['Technology', 2.0]]),
        preferredTags: new Map([['AI', 1.0]]),
        recentArticles: [],
        feedbackHistory: []
      };

      const score = calculator.calculateSimilarityScore(article, profile);
      
      expect(score).toBe(0);
    });

    it('should incorporate positive feedback for similar articles', () => {
      const article: Article = {
        id: 'a2',
        title: 'Test Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: ['AI'],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const profile: UserProfile = {
        userId: 'user1',
        categoryWeights: new Map([['Technology', 1.0]]),
        preferredTags: new Map([['AI', 1.0]]),
        recentArticles: [
          {
            articleId: 'a1',
            viewedAt: new Date(),
            category: 'Technology',
            tags: ['AI']
          }
        ],
        feedbackHistory: [
          {
            userId: 'user1',
            articleId: 'a1',
            feedbackType: 'like',
            timestamp: new Date(),
            sessionId: 's1'
          }
        ]
      };

      const score = calculator.calculateSimilarityScore(article, profile);
      
      // Should get base score + 5 for positive feedback
      expect(score).toBeGreaterThan(12);
    });

    it('should incorporate negative feedback for similar articles', () => {
      const article: Article = {
        id: 'a2',
        title: 'Test Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: ['AI'],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const profile: UserProfile = {
        userId: 'user1',
        categoryWeights: new Map([['Technology', 1.0]]),
        preferredTags: new Map([['AI', 1.0]]),
        recentArticles: [
          {
            articleId: 'a1',
            viewedAt: new Date(),
            category: 'Technology',
            tags: ['AI']
          }
        ],
        feedbackHistory: [
          {
            userId: 'user1',
            articleId: 'a1',
            feedbackType: 'dislike',
            timestamp: new Date(),
            sessionId: 's1'
          }
        ]
      };

      const score = calculator.calculateSimilarityScore(article, profile);
      
      // Should get base score - 5 for negative feedback
      expect(score).toBeLessThan(12);
    });
  });
});
