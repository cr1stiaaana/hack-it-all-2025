/**
 * Represents a single article view in a user's viewing history
 */
export interface ArticleView {
  articleId: string;
  viewedAt: Date;
  category: string;
  tags: string[];
}
