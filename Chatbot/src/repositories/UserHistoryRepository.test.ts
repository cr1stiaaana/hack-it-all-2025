import { describe, it, expect, beforeEach } from 'vitest';
import { UserHistoryRepository } from './UserHistoryRepository';
import { ArticleView } from '../models/ArticleView';

describe('UserHistoryRepository', () => {
  let repository: UserHistoryRepository;

  beforeEach(() => {
    repository = new UserHistoryRepository();
  });

  const createView = (articleId: string, daysAgo: number = 0): ArticleView => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    return {
      articleId,
      viewedAt: date,
      category: 'Technology',
      tags: ['test'],
    };
  };

  it('should add and retrieve user history', () => {
    const view = createView('article-1');
    repository.addView('user-1', view);
    
    const history = repository.getHistory('user-1');
    expect(history).toHaveLength(1);
    expect(history[0].articleId).toBe('article-1');
  });

  it('should return empty array for user with no history', () => {
    const history = repository.getHistory('user-1');
    expect(history).toEqual([]);
  });

  it('should sort history by most recent first', () => {
    repository.addView('user-1', createView('article-1', 5));
    repository.addView('user-1', createView('article-2', 1));
    repository.addView('user-1', createView('article-3', 10));
    
    const history = repository.getHistory('user-1');
    expect(history[0].articleId).toBe('article-2'); // Most recent
    expect(history[2].articleId).toBe('article-3'); // Oldest
  });

  it('should paginate history correctly', () => {
    for (let i = 1; i <= 15; i++) {
      repository.addView('user-1', createView(`article-${i}`, 15 - i));
    }
    
    const page1 = repository.getHistoryPaginated('user-1', 1, 10);
    expect(page1).toHaveLength(10);
    
    const page2 = repository.getHistoryPaginated('user-1', 2, 10);
    expect(page2).toHaveLength(5);
  });

  it('should filter history by time period', () => {
    repository.addView('user-1', createView('article-1', 10)); // Within 30 days
    repository.addView('user-1', createView('article-2', 40)); // Outside 30 days
    repository.addView('user-1', createView('article-3', 5));  // Within 30 days
    
    const recentHistory = repository.getRecentHistory('user-1', 30);
    expect(recentHistory).toHaveLength(2);
    expect(recentHistory.map(v => v.articleId)).toContain('article-1');
    expect(recentHistory.map(v => v.articleId)).toContain('article-3');
  });

  it('should return correct history count', () => {
    repository.addView('user-1', createView('article-1'));
    repository.addView('user-1', createView('article-2'));
    repository.addView('user-1', createView('article-3'));
    
    expect(repository.getHistoryCount('user-1')).toBe(3);
  });
});
