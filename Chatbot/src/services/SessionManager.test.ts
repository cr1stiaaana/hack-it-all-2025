import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from './SessionManager';
import { Exchange } from '../models';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const userId = 'user123';
      const session = sessionManager.createSession(userId);

      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.conversationContext).toEqual([]);
      expect(session.recommendedArticles).toEqual([]);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivityAt).toBeInstanceOf(Date);
    });

    it('should create sessions with different IDs', () => {
      const session1 = sessionManager.createSession('user1');
      const session2 = sessionManager.createSession('user2');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', () => {
      const userId = 'user123';
      const createdSession = sessionManager.createSession(userId);
      
      const retrievedSession = sessionManager.getSession(createdSession.sessionId);

      expect(retrievedSession).not.toBeNull();
      expect(retrievedSession?.sessionId).toBe(createdSession.sessionId);
      expect(retrievedSession?.userId).toBe(userId);
    });

    it('should return null for non-existent session', () => {
      const session = sessionManager.getSession('non-existent-id');
      expect(session).toBeNull();
    });
  });

  describe('addToContext', () => {
    it('should add exchange to conversation context', () => {
      const session = sessionManager.createSession('user123');
      const exchange: Exchange = {
        userMessage: 'Show me recommendations',
        botResponse: 'Here are some articles...',
        timestamp: new Date(),
        mentionedArticles: ['article1', 'article2']
      };

      sessionManager.addToContext(session.sessionId, exchange);

      const updatedSession = sessionManager.getSession(session.sessionId);
      expect(updatedSession?.conversationContext).toHaveLength(1);
      expect(updatedSession?.conversationContext[0]).toEqual(exchange);
    });

    it('should limit context to 10 most recent exchanges', () => {
      const session = sessionManager.createSession('user123');

      // Add 15 exchanges
      for (let i = 0; i < 15; i++) {
        const exchange: Exchange = {
          userMessage: `Message ${i}`,
          botResponse: `Response ${i}`,
          timestamp: new Date(),
          mentionedArticles: [`article${i}`]
        };
        sessionManager.addToContext(session.sessionId, exchange);
      }

      const updatedSession = sessionManager.getSession(session.sessionId);
      expect(updatedSession?.conversationContext).toHaveLength(10);
      
      // Should keep the most recent 10 (indices 5-14)
      expect(updatedSession?.conversationContext[0].userMessage).toBe('Message 5');
      expect(updatedSession?.conversationContext[9].userMessage).toBe('Message 14');
    });

    it('should update lastActivityAt when adding to context', () => {
      const session = sessionManager.createSession('user123');
      const originalActivityTime = session.lastActivityAt;

      // Wait a bit to ensure time difference
      setTimeout(() => {
        const exchange: Exchange = {
          userMessage: 'Test',
          botResponse: 'Response',
          timestamp: new Date(),
          mentionedArticles: []
        };
        sessionManager.addToContext(session.sessionId, exchange);

        const updatedSession = sessionManager.getSession(session.sessionId);
        expect(updatedSession?.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
          originalActivityTime.getTime()
        );
      }, 10);
    });

    it('should throw error for non-existent session', () => {
      const exchange: Exchange = {
        userMessage: 'Test',
        botResponse: 'Response',
        timestamp: new Date(),
        mentionedArticles: []
      };

      expect(() => {
        sessionManager.addToContext('non-existent-id', exchange);
      }).toThrow('Session not found');
    });
  });

  describe('resolveReference', () => {
    it('should resolve "this article" to most recent article', () => {
      const session = sessionManager.createSession('user123');
      
      const exchange1: Exchange = {
        userMessage: 'Show recommendations',
        botResponse: 'Here are articles',
        timestamp: new Date(),
        mentionedArticles: ['article1', 'article2']
      };
      
      const exchange2: Exchange = {
        userMessage: 'Tell me more',
        botResponse: 'More info',
        timestamp: new Date(),
        mentionedArticles: ['article3']
      };

      sessionManager.addToContext(session.sessionId, exchange1);
      sessionManager.addToContext(session.sessionId, exchange2);

      const resolved = sessionManager.resolveReference(session.sessionId, 'this article');
      expect(resolved).toBe('article3');
    });

    it('should resolve "that article" to second most recent article', () => {
      const session = sessionManager.createSession('user123');
      
      const exchange: Exchange = {
        userMessage: 'Show recommendations',
        botResponse: 'Here are articles',
        timestamp: new Date(),
        mentionedArticles: ['article1', 'article2', 'article3']
      };

      sessionManager.addToContext(session.sessionId, exchange);

      const resolved = sessionManager.resolveReference(session.sessionId, 'that article');
      expect(resolved).toBe('article2');
    });

    it('should handle various reference formats', () => {
      const session = sessionManager.createSession('user123');
      
      const exchange: Exchange = {
        userMessage: 'Show recommendations',
        botResponse: 'Here are articles',
        timestamp: new Date(),
        mentionedArticles: ['article1']
      };

      sessionManager.addToContext(session.sessionId, exchange);

      expect(sessionManager.resolveReference(session.sessionId, 'this')).toBe('article1');
      expect(sessionManager.resolveReference(session.sessionId, 'this one')).toBe('article1');
      expect(sessionManager.resolveReference(session.sessionId, 'THIS ARTICLE')).toBe('article1');
    });

    it('should return null for empty context', () => {
      const session = sessionManager.createSession('user123');
      
      const resolved = sessionManager.resolveReference(session.sessionId, 'this article');
      expect(resolved).toBeNull();
    });

    it('should return null for non-existent session', () => {
      const resolved = sessionManager.resolveReference('non-existent-id', 'this article');
      expect(resolved).toBeNull();
    });

    it('should search by article ID substring', () => {
      const session = sessionManager.createSession('user123');
      
      const exchange: Exchange = {
        userMessage: 'Show recommendations',
        botResponse: 'Here are articles',
        timestamp: new Date(),
        mentionedArticles: ['tech-article-123', 'science-article-456']
      };

      sessionManager.addToContext(session.sessionId, exchange);

      const resolved = sessionManager.resolveReference(session.sessionId, 'tech');
      expect(resolved).toBe('tech-article-123');
    });
  });

  describe('addRecommendedArticle', () => {
    it('should add article to recommended list', () => {
      const session = sessionManager.createSession('user123');
      
      sessionManager.addRecommendedArticle(session.sessionId, 'article1');
      sessionManager.addRecommendedArticle(session.sessionId, 'article2');

      const recommended = sessionManager.getRecommendedArticles(session.sessionId);
      expect(recommended).toEqual(['article1', 'article2']);
    });

    it('should not add duplicate articles', () => {
      const session = sessionManager.createSession('user123');
      
      sessionManager.addRecommendedArticle(session.sessionId, 'article1');
      sessionManager.addRecommendedArticle(session.sessionId, 'article1');

      const recommended = sessionManager.getRecommendedArticles(session.sessionId);
      expect(recommended).toEqual(['article1']);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.addRecommendedArticle('non-existent-id', 'article1');
      }).toThrow('Session not found');
    });
  });

  describe('getRecommendedArticles', () => {
    it('should return empty array for session with no recommendations', () => {
      const session = sessionManager.createSession('user123');
      
      const recommended = sessionManager.getRecommendedArticles(session.sessionId);
      expect(recommended).toEqual([]);
    });

    it('should return empty array for non-existent session', () => {
      const recommended = sessionManager.getRecommendedArticles('non-existent-id');
      expect(recommended).toEqual([]);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove sessions older than max age', () => {
      const session1 = sessionManager.createSession('user1');
      const session2 = sessionManager.createSession('user2');

      // Manually set lastActivityAt to simulate old session
      const oldSession = sessionManager.getSession(session1.sessionId);
      if (oldSession) {
        oldSession.lastActivityAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      }

      sessionManager.cleanupExpiredSessions(24 * 60 * 60 * 1000); // 24 hours

      expect(sessionManager.getSession(session1.sessionId)).toBeNull();
      expect(sessionManager.getSession(session2.sessionId)).not.toBeNull();
    });

    it('should keep sessions within max age', () => {
      const session = sessionManager.createSession('user1');

      sessionManager.cleanupExpiredSessions(24 * 60 * 60 * 1000);

      expect(sessionManager.getSession(session.sessionId)).not.toBeNull();
    });
  });
});
