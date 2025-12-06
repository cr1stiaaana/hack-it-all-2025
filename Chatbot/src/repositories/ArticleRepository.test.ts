import { describe, it, expect, beforeEach } from 'vitest';
import { ArticleRepository } from './ArticleRepository';
import { Article } from '../models/Article';

describe('ArticleRepository', () => {
  let repository: ArticleRepository;

  beforeEach(() => {
    repository = new ArticleRepository();
  });

  const createArticle = (overrides: Partial<Article> = {}): Article => ({
    id: 'article-1',
    title: 'Test Article',
    author: 'Test Author',
    publicationDate: new Date('2024-01-01'),
    category: 'Technology',
    summary: 'A test article',
    content: 'Test content',
    tags: ['test', 'tech'],
    likeCount: 0,
    dislikeCount: 0,
    metadata: {},
    ...overrides,
  });

  it('should store and retrieve an article by ID', () => {
    const article = createArticle();
    repository.store(article);
    
    const retrieved = repository.findById('article-1');
    expect(retrieved).toEqual(article);
  });

  it('should return undefined for non-existent article', () => {
    const retrieved = repository.findById('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should find articles by category', () => {
    repository.store(createArticle({ id: '1', category: 'Technology' }));
    repository.store(createArticle({ id: '2', category: 'Science' }));
    repository.store(createArticle({ id: '3', category: 'Technology' }));
    
    const techArticles = repository.findByCategory('Technology');
    expect(techArticles).toHaveLength(2);
    expect(techArticles.map(a => a.id)).toContain('1');
    expect(techArticles.map(a => a.id)).toContain('3');
  });

  it('should find articles by tags', () => {
    repository.store(createArticle({ id: '1', tags: ['javascript', 'web'] }));
    repository.store(createArticle({ id: '2', tags: ['python', 'ai'] }));
    repository.store(createArticle({ id: '3', tags: ['javascript', 'node'] }));
    
    const jsArticles = repository.findByTags(['javascript']);
    expect(jsArticles).toHaveLength(2);
    expect(jsArticles.map(a => a.id)).toContain('1');
    expect(jsArticles.map(a => a.id)).toContain('3');
  });

  it('should handle articles with incomplete metadata', () => {
    const incompleteArticle = createArticle({ 
      id: '1', 
      category: '', 
      title: '' 
    });
    repository.store(incompleteArticle);
    
    // After enrichment, the article will have inferred category and generated title
    const retrieved = repository.findById('1');
    const hasSufficient = repository.hasSufficientMetadata(retrieved!);
    expect(hasSufficient).toBe(true); // Now has sufficient metadata after enrichment
  });

  it('should identify recommendable articles', () => {
    repository.store(createArticle({ id: '1' })); // Complete
    repository.store(createArticle({ id: '2', category: '', title: '' })); // Will be enriched
    
    const recommendable = repository.findRecommendable();
    // Both articles are now recommendable after enrichment
    expect(recommendable).toHaveLength(2);
  });

  it('should enrich articles with missing category on store', () => {
    const article = createArticle({
      id: '1',
      category: '',
      title: 'Programming Guide',
      content: 'Learn about software development and coding algorithms'
    });
    
    repository.store(article);
    const retrieved = repository.findById('1');
    
    expect(retrieved?.category).toBe('Technology');
    expect(retrieved?.metadata.categoryInferred).toBe(true);
  });

  it('should enrich articles with missing title on store', () => {
    const article = createArticle({
      id: 'abc123',
      title: '',
      summary: 'This is a summary about the article'
    });
    
    repository.store(article);
    const retrieved = repository.findById('abc123');
    
    expect(retrieved?.title).toContain('Article abc123');
    expect(retrieved?.metadata.titleGenerated).toBe(true);
  });

  it('should mark articles with incomplete metadata for user notification', () => {
    // Article with inferred category should be marked as incomplete
    const articleWithInferredCategory = createArticle({
      id: '1',
      category: '',
      title: 'Tech Article',
      content: 'About programming and software'
    });
    
    repository.store(articleWithInferredCategory);
    const retrieved = repository.findById('1');
    
    // Article is stored and enriched
    expect(retrieved).toBeDefined();
    expect(retrieved?.category).toBe('Technology');
    
    // But marked as having incomplete metadata
    expect(repository.hasIncompleteMetadata(retrieved!)).toBe(true);
    expect(retrieved?.metadata.categoryInferred).toBe(true);
  });

  it('should identify articles with incomplete metadata', () => {
    const completeArticle = createArticle({ id: '1' });
    const articleWithInferredCategory = createArticle({
      id: '2',
      metadata: { categoryInferred: true }
    });
    const articleWithoutAuthor = createArticle({
      id: '3',
      author: ''
    });
    
    expect(repository.hasIncompleteMetadata(completeArticle)).toBe(false);
    expect(repository.hasIncompleteMetadata(articleWithInferredCategory)).toBe(true);
    expect(repository.hasIncompleteMetadata(articleWithoutAuthor)).toBe(true);
  });

  it('should allow articles with inferable category to be recommendable', () => {
    const article = createArticle({
      id: '1',
      category: '',
      title: 'Tech Article',
      content: 'About programming and software development'
    });
    
    repository.store(article);
    const recommendable = repository.findRecommendable();
    
    expect(recommendable).toHaveLength(1);
    expect(recommendable[0].id).toBe('1');
  });
});
