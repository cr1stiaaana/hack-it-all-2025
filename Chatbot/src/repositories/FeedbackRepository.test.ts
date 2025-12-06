import { describe, it, expect, beforeEach } from 'vitest';
import { FeedbackRepository } from './FeedbackRepository';
import { Feedback, FeedbackType } from '../models/Feedback';

describe('FeedbackRepository', () => {
  let repository: FeedbackRepository;

  beforeEach(() => {
    repository = new FeedbackRepository();
  });

  const createFeedback = (
    userId: string,
    articleId: string,
    type: FeedbackType,
    sessionId: string = 'session-1',
    minutesAgo: number = 0
  ): Feedback => {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
    
    return {
      userId,
      articleId,
      feedbackType: type,
      timestamp,
      sessionId,
    };
  };

  it('should store and retrieve feedback by user', () => {
    const feedback = createFeedback('user-1', 'article-1', 'like');
    repository.store(feedback);
    
    const userFeedback = repository.findByUser('user-1');
    expect(userFeedback).toHaveLength(1);
    expect(userFeedback[0].articleId).toBe('article-1');
  });

  it('should retrieve feedback by session', () => {
    repository.store(createFeedback('user-1', 'article-1', 'like', 'session-1'));
    repository.store(createFeedback('user-1', 'article-2', 'dislike', 'session-2'));
    repository.store(createFeedback('user-2', 'article-3', 'viewed', 'session-1'));
    
    const sessionFeedback = repository.findBySession('session-1');
    expect(sessionFeedback).toHaveLength(2);
  });

  it('should retrieve feedback by user and session', () => {
    repository.store(createFeedback('user-1', 'article-1', 'like', 'session-1'));
    repository.store(createFeedback('user-1', 'article-2', 'dislike', 'session-2'));
    repository.store(createFeedback('user-2', 'article-3', 'viewed', 'session-1'));
    
    const feedback = repository.findByUserAndSession('user-1', 'session-1');
    expect(feedback).toHaveLength(1);
    expect(feedback[0].articleId).toBe('article-1');
  });

  it('should retrieve most recent feedback for user and article', () => {
    repository.store(createFeedback('user-1', 'article-1', 'like', 'session-1', 10));
    repository.store(createFeedback('user-1', 'article-1', 'dislike', 'session-1', 5));
    
    const feedback = repository.findByUserAndArticle('user-1', 'article-1');
    expect(feedback?.feedbackType).toBe('dislike'); // Most recent
  });

  it('should filter feedback by type', () => {
    repository.store(createFeedback('user-1', 'article-1', 'like'));
    repository.store(createFeedback('user-1', 'article-2', 'dislike'));
    repository.store(createFeedback('user-1', 'article-3', 'like'));
    
    const likes = repository.findByUserAndType('user-1', 'like');
    expect(likes).toHaveLength(2);
  });

  it('should sort feedback by most recent first', () => {
    repository.store(createFeedback('user-1', 'article-1', 'like', 'session-1', 10));
    repository.store(createFeedback('user-1', 'article-2', 'dislike', 'session-1', 5));
    repository.store(createFeedback('user-1', 'article-3', 'viewed', 'session-1', 15));
    
    const feedback = repository.findByUser('user-1');
    expect(feedback[0].articleId).toBe('article-2'); // Most recent
    expect(feedback[2].articleId).toBe('article-3'); // Oldest
  });
});
