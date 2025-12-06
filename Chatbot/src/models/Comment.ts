/**
 * Represents a user comment on an article
 */
export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  username: string;
  text: string;
  postedAt: Date;
}
