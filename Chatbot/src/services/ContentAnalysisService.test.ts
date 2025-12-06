import { describe, it, expect, beforeEach } from 'vitest';
import { ContentAnalysisService } from './ContentAnalysisService';
import { Article } from '../models/Article';

describe('ContentAnalysisService', () => {
  let service: ContentAnalysisService;

  beforeEach(() => {
    service = new ContentAnalysisService();
  });

  describe('inferCategory', () => {
    it('should return existing category if present', () => {
      const article: Article = {
        id: '1',
        title: 'Test Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'A summary',
        content: 'Content about business and finance',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.inferCategory(article)).toBe('Technology');
    });

    it('should infer Technology category from tech keywords', () => {
      const article: Article = {
        id: '1',
        title: 'Introduction to Programming',
        author: 'Author',
        publicationDate: new Date(),
        category: '',
        summary: 'Learn about software development and coding',
        content: 'This article covers programming, algorithms, and computer science fundamentals',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.inferCategory(article)).toBe('Technology');
    });

    it('should infer Science category from science keywords', () => {
      const article: Article = {
        id: '2',
        title: 'Research Breakthrough',
        author: 'Author',
        publicationDate: new Date(),
        category: '',
        summary: 'New scientific discovery in laboratory',
        content: 'Scientists conducted experiments and published their research findings',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.inferCategory(article)).toBe('Science');
    });

    it('should return Uncategorized when no keywords match', () => {
      const article: Article = {
        id: '3',
        title: 'Random Article',
        author: 'Author',
        publicationDate: new Date(),
        category: '',
        summary: 'xyz abc def',
        content: 'qwerty asdfgh zxcvbn',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.inferCategory(article)).toBe('Uncategorized');
    });

    it('should return Uncategorized when no content available', () => {
      const article: Article = {
        id: '4',
        title: '',
        author: 'Author',
        publicationDate: new Date(),
        category: '',
        summary: '',
        content: '',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.inferCategory(article)).toBe('Uncategorized');
    });
  });

  describe('generateTitleFallback', () => {
    it('should return existing title if present', () => {
      const article: Article = {
        id: '1',
        title: 'Existing Title',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'A summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.generateTitleFallback(article)).toBe('Existing Title');
    });

    it('should generate title from summary when title is missing', () => {
      const article: Article = {
        id: 'abc123def456',
        title: '',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'This is a summary about programming and software development',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const result = service.generateTitleFallback(article);
      expect(result).toContain('Article abc123de');
      expect(result).toContain('This is a summary about programming');
    });

    it('should generate title from content when title and summary are missing', () => {
      const article: Article = {
        id: 'xyz789',
        title: '',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: '',
        content: 'This is the main content of the article with lots of information',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const result = service.generateTitleFallback(article);
      expect(result).toContain('Article xyz789');
      expect(result).toContain('This is the main content of');
    });

    it('should use only ID when no content available', () => {
      const article: Article = {
        id: 'test123',
        title: '',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: '',
        content: '',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.generateTitleFallback(article)).toBe('Article test123');
    });
  });

  describe('hasSufficientMetadata', () => {
    it('should return true for article with complete metadata', () => {
      const article: Article = {
        id: '1',
        title: 'Complete Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'A summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.hasSufficientMetadata(article)).toBe(true);
    });

    it('should return true for article with inferable category', () => {
      const article: Article = {
        id: '2',
        title: 'Tech Article',
        author: 'Author',
        publicationDate: new Date(),
        category: '',
        summary: 'About programming and software',
        content: 'Content about coding',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.hasSufficientMetadata(article)).toBe(true);
    });

    it('should return false for article without ID', () => {
      const article: Article = {
        id: '',
        title: 'Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.hasSufficientMetadata(article)).toBe(false);
    });

    it('should return false for article without category or content', () => {
      const article: Article = {
        id: '3',
        title: '',
        author: 'Author',
        publicationDate: new Date(),
        category: '',
        summary: '',
        content: '',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.hasSufficientMetadata(article)).toBe(false);
    });
  });

  describe('enrichArticle', () => {
    it('should infer category for article without category', () => {
      const article: Article = {
        id: '1',
        title: 'Programming Guide',
        author: 'Author',
        publicationDate: new Date(),
        category: '',
        summary: 'Learn software development',
        content: 'This covers coding and algorithms',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const enriched = service.enrichArticle(article);
      expect(enriched.category).toBe('Technology');
      expect(enriched.metadata.categoryInferred).toBe(true);
    });

    it('should generate title for article without title', () => {
      const article: Article = {
        id: 'abc123',
        title: '',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'This is a summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const enriched = service.enrichArticle(article);
      expect(enriched.title).toContain('Article abc123');
      expect(enriched.metadata.titleGenerated).toBe(true);
    });

    it('should not modify article with complete metadata', () => {
      const article: Article = {
        id: '1',
        title: 'Complete Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      const enriched = service.enrichArticle(article);
      expect(enriched.title).toBe('Complete Article');
      expect(enriched.category).toBe('Technology');
      expect(enriched.metadata.categoryInferred).toBeUndefined();
      expect(enriched.metadata.titleGenerated).toBeUndefined();
    });
  });

  describe('hasIncompleteMetadata', () => {
    it('should return true for article with inferred category', () => {
      const article: Article = {
        id: '1',
        title: 'Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: { categoryInferred: true }
      };

      expect(service.hasIncompleteMetadata(article)).toBe(true);
    });

    it('should return true for article with generated title', () => {
      const article: Article = {
        id: '1',
        title: 'Article 1',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: { titleGenerated: true }
      };

      expect(service.hasIncompleteMetadata(article)).toBe(true);
    });

    it('should return true for article without author', () => {
      const article: Article = {
        id: '1',
        title: 'Article',
        author: '',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.hasIncompleteMetadata(article)).toBe(true);
    });

    it('should return false for article with complete metadata', () => {
      const article: Article = {
        id: '1',
        title: 'Complete Article',
        author: 'Author',
        publicationDate: new Date(),
        category: 'Technology',
        summary: 'Summary',
        content: 'Content',
        tags: [],
        likeCount: 0,
        dislikeCount: 0,
        metadata: {}
      };

      expect(service.hasIncompleteMetadata(article)).toBe(false);
    });
  });
});
