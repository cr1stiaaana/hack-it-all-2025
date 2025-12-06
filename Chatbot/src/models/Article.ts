/**
 * Represents an article in the system with all metadata and content
 */
export interface Article {
  id: string;
  title: string;
  author: string;
  publicationDate: Date;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  likeCount: number;
  dislikeCount: number;
  metadata: Record<string, any>;
}
