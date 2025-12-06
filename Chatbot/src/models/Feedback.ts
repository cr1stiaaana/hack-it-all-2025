/**
 * Represents user feedback on an article
 */
export type FeedbackType = 'like' | 'dislike' | 'viewed' | 'rejected';

export interface Feedback {
  userId: string;
  articleId: string;
  feedbackType: FeedbackType;
  timestamp: Date;
  sessionId: string;
}
