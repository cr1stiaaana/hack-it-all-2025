import { ArticleView } from './ArticleView';
import { Feedback } from './Feedback';

/**
 * Represents a user's preference profile built from viewing history and feedback
 */
export interface UserProfile {
  userId: string;
  categoryWeights: Map<string, number>;
  preferredTags: Map<string, number>;
  recentArticles: ArticleView[];
  feedbackHistory: Feedback[];
}
