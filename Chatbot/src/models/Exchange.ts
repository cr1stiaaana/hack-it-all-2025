/**
 * Represents a single exchange (user message + bot response) in a conversation
 */
export interface Exchange {
  userMessage: string;
  botResponse: string;
  timestamp: Date;
  mentionedArticles: string[];
}
