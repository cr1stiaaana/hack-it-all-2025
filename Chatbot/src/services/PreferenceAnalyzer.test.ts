import { describe, it, expect, beforeEach } from 'vitest';
import { PreferenceAnalyzer } from './PreferenceAnalyzer';
import { UserHistoryRepository } from '../repositories/UserHistoryRepository';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { ArticleView } from '../models/ArticleView';

describe('PreferenceAnalyzer', () => {
  let analyzer: PreferenceAnalyzer;
  let historyRepo: UserHistoryRepository;
  let feedbackRepo: FeedbackRepository;

  beforeEach(() => {
    historyRepo = new UserHistoryRepository();
    feedbackRepo = new FeedbackRepository();
    analyzer = new PreferenceAnalyzer(historyRepo, feedbackRepo);
  });

  describe('buildUserProfile', () => {
    it('should build profile with category weights from viewing history', () => {
      const userId = 'user1';
      const now = new Date();
      
      historyRepo.addView(userId, {
        articleId: 'a1',
        viewedAt: now,
        category: 'Technology',
        tags: ['AI', 'ML']
      });
      
      historyRepo.addView(userId, {
        articleId: 'a2',
        viewedAt: new Date(now.getTime() - 1000),
        category: 'Technology',
        tags: ['Programming']
      });

      const profile = analyzer.buildUserProfile(userId);
      
      expect(profile.userId).toBe(userId);
      expect(profile.categoryWeights.get('Technology')).toBeGreaterThan(0);
      expect(profile.recentArticles.length).toBe(2);
    });

    it('should handle empty history', () => {
      const profile = analyzer.buildUserProfile('user-no-history');
      
      expect(profile.userId).toBe('user-no-history');
      expect(profile.categoryWeights.size).toBe(0);
      expect(profile.recentArticles.length).toBe(0);
    });
  });

  describe('getCategoryPreferences', () => {
    it('should return categories sorted by frequency', () => {
      const userId = 'user1';
      const now = new Date();
      
      // Add 3 Technology articles
      for (let i = 0; i < 3; i++) {
        historyRepo.addView(userId, {
          articleId: `tech${i}`,
          viewedAt: new Date(now.getTime() - i * 1000),
          category: 'Technology',
          tags: []
        });
      }
      
      // Add 1 Science article
      historyRepo.addView(userId, {
        articleId: 's1',
        viewedAt: new Date(now.getTime() - 4000),
        category: 'Science',
        tags: []
      });

      const preferences = analyzer.getCategoryPreferences(userId);
      
      expect(preferences.length).toBe(2);
      expect(preferences[0].category).toBe('Technology');
      expect(preferences[1].category).toBe('Science');
    });

    it('should break ties by recency', () => {
      const userId = 'user1';
      const now = new Date();
      
      // Add 1 Technology article (most recent)
      historyRepo.addView(userId, {
        articleId: 'tech1',
        viewedAt: now,
        category: 'Technology',
        tags: []
      });
      
      // Add 1 Science article (older)
      historyRepo.addView(userId, {
        articleId: 's1',
        viewedAt: new Date(now.getTime() - 10000),
        category: 'Science',
        tags: []
      });

      const preferences = analyzer.getCategoryPreferences(userId);
      
      // Technology should come first due to recency
      expect(preferences[0].category).toBe('Technology');
    });
  });

  describe('updateProfileWithFeedback', () => {
    it('should increase weights for liked articles', () => {
      const userId = 'user1';
      const profile = analyzer.buildUserProfile(userId);
      
      const updatedProfile = analyzer.updateProfileWithFeedback(
        profile,
        'Technology',
        ['AI', 'ML'],
        'like'
      );
      
      expect(updatedProfile.categoryWeights.get('Technology')).toBe(0.2);
      expect(updatedProfile.preferredTags.get('AI')).toBe(0.2);
      expect(updatedProfile.preferredTags.get('ML')).toBe(0.2);
    });

    it('should decrease weights for disliked articles', () => {
      const userId = 'user1';
      const profile = analyzer.buildUserProfile(userId);
      
      const updatedProfile = analyzer.updateProfileWithFeedback(
        profile,
        'Sports',
        ['Football'],
        'dislike'
      );
      
      expect(updatedProfile.categoryWeights.get('Sports')).toBe(-0.2);
      expect(updatedProfile.preferredTags.get('Football')).toBe(-0.2);
    });
  });
});
