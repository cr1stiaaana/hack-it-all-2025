import { Article } from '../models/Article';
import { Exchange } from '../models/Exchange';
import { FeedbackType } from '../models/Feedback';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { UserHistoryRepository } from '../repositories/UserHistoryRepository';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { RecommendationEngine } from './RecommendationEngine';
import { SessionManager } from './SessionManager';
import { PreferenceAnalyzer } from './PreferenceAnalyzer';

/**
 * Response from the chatbot
 */
export interface ChatResponse {
  message: string;
  articles?: Article[];
  metadata?: Record<string, any>;
}

/**
 * User intent extracted from message
 */
export type UserIntent = 
  | 'request_history'
  | 'request_recommendations'
  | 'request_personalized_recommendations'
  | 'provide_feedback'
  | 'ask_question'
  | 'request_article_details'
  | 'request_similar_articles'
  | 'unknown';

/**
 * Chatbot interface for handling user interactions
 */
export class ChatbotInterface {
  private geminiService: any = null;

  constructor(
    private articleRepo: ArticleRepository,
    private userHistoryRepo: UserHistoryRepository,
    private feedbackRepo: FeedbackRepository,
    private recommendationEngine: RecommendationEngine,
    private sessionManager: SessionManager,
    private preferenceAnalyzer: PreferenceAnalyzer,
    geminiService?: any
  ) {
    this.geminiService = geminiService;
  }

  /**
   * Process a user message and generate a response
   * @param userId - The user ID
   * @param message - The user's message
   * @param sessionId - The session ID
   * @returns ChatResponse with message and optional articles
   */
  async processMessage(userId: string, message: string, sessionId: string): Promise<ChatResponse> {
    // Get or create session
    let session = this.sessionManager.getSession(sessionId);
    if (!session) {
      session = this.sessionManager.createSession(userId);
    }

    // Parse user intent
    const intent = this.parseIntent(message);

    // Route to appropriate handler
    let response: ChatResponse;
    
    switch (intent) {
      case 'request_history':
        response = this.handleHistoryRequest(userId, message);
        break;
      
      case 'request_recommendations':
        response = await this.handleRecommendationRequest(userId, session.sessionId);
        break;
      
      case 'request_personalized_recommendations':
        response = this.handlePersonalizedRecommendations(userId, session.sessionId);
        break;
      
      case 'provide_feedback':
        response = this.handleFeedback(userId, message, session.sessionId);
        break;
      
      case 'request_article_details':
        response = this.handleArticleDetailsRequest(userId, message, session.sessionId);
        break;
      
      case 'request_similar_articles':
        response = this.handleSimilarArticlesRequest(userId, message, session.sessionId);
        break;
      
      case 'ask_question':
      case 'unknown':
      default:
        response = await this.handleGeneralConversation(userId, message, session.sessionId);
    }

    // Add exchange to conversation context
    const exchange: Exchange = {
      userMessage: message,
      botResponse: response.message,
      timestamp: new Date(),
      mentionedArticles: response.articles?.map(a => a.id) || []
    };
    
    this.sessionManager.addToContext(session.sessionId, exchange);

    return response;
  }

  /**
   * Parse user intent from message
   * @param message - The user's message
   * @returns The detected intent
   */
  private parseIntent(message: string): UserIntent {
    const lowerMessage = message.toLowerCase().trim();

    // Check for history requests
    if (lowerMessage.includes('history') || 
        lowerMessage.includes('what have i read') ||
        lowerMessage.includes('what did i read') ||
        lowerMessage.includes('show my articles') ||
        lowerMessage.includes('viewed articles')) {
      return 'request_history';
    }

    // Check if user is responding to recommendation choice
    if ((lowerMessage.includes('based on') || lowerMessage.includes('what i') || lowerMessage.includes('my reading') ||
         lowerMessage.includes('option 1') || lowerMessage.includes('first option') || lowerMessage.includes('personalized')) &&
        (lowerMessage.includes('read') || lowerMessage.includes('history') || lowerMessage.includes('recommend'))) {
      return 'request_personalized_recommendations';
    }

    // Check for recommendation requests with specific topics (should trigger search)
    if ((lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('find')) &&
        (lowerMessage.includes(' about ') || lowerMessage.includes(' on ') || lowerMessage.includes(' regarding '))) {
      return 'ask_question'; // Will be handled by Gemini to search
    }

    // Check for general recommendation requests (from history)
    if (lowerMessage.includes('recommend') ||
        lowerMessage.includes('suggest') ||
        lowerMessage.includes('what should i read') ||
        lowerMessage.includes('show me articles')) {
      return 'request_recommendations';
    }

    // Check for feedback
    if (lowerMessage.includes('like') ||
        lowerMessage.includes('dislike') ||
        lowerMessage.includes('reject') ||
        lowerMessage.includes('not interested')) {
      return 'provide_feedback';
    }

    // Check for article details
    if (lowerMessage.includes('tell me more') ||
        lowerMessage.includes('details about') ||
        lowerMessage.includes('explain') ||
        lowerMessage.includes('why recommend') ||
        lowerMessage.includes('more about')) {
      return 'request_article_details';
    }

    // Check for similar articles
    if (lowerMessage.includes('similar') ||
        lowerMessage.includes('more like this') ||
        lowerMessage.includes('related to')) {
      return 'request_similar_articles';
    }

    return 'unknown';
  }

  /**
   * Handle history request
   */
  private handleHistoryRequest(userId: string, message: string): ChatResponse {
    // Extract page number if present (default to page 1)
    const pageMatch = message.match(/page\s+(\d+)/i);
    const page = pageMatch ? parseInt(pageMatch[1]) : 1;
    
    return this.getHistory(userId, page);
  }

  /**
   * Handle recommendation request
   */
  private async handleRecommendationRequest(userId: string, _sessionId: string): Promise<ChatResponse> {
    const historyCount = this.userHistoryRepo.getHistoryCount(userId);
    
    // If user has no history, ask what topic they're interested in
    if (historyCount === 0) {
      return {
        message: "You haven't viewed any articles yet! 📚\n\n" +
                 "What topic are you interested in? I can search for articles on any subject you'd like to explore!"
      };
    }

    // User has history - analyze their interests
    const topCategories = this.preferenceAnalyzer.getCategoryPreferences(userId).slice(0, 3);
    
    // Get category names
    const categoryNames = topCategories.map(c => c.category).join(', ');
    
    // Create intelligent prompt
    const message = `I see you've been reading about ${categoryNames}! 📖\n\n` +
                   `Would you like:\n` +
                   `1. **Recommendations based on what you've read** (${categoryNames})\n` +
                   `2. **Search for articles on a new topic**\n\n` +
                   `Just let me know your preference, or tell me a specific topic you'd like to explore!`;

    return {
      message
    };
  }

  /**
   * Handle personalized recommendations based on user's reading history
   */
  private handlePersonalizedRecommendations(userId: string, sessionId: string): ChatResponse {
    const excludeIds = this.sessionManager.getRecommendedArticles(sessionId);
    const recommendations = this.recommendationEngine.generateRecommendations(userId, 3, excludeIds);

    // Track recommended articles in session
    recommendations.forEach(article => {
      this.sessionManager.addRecommendedArticle(sessionId, article.id);
    });

    if (recommendations.length === 0) {
      return {
        message: "I don't have any suitable recommendations at the moment. " +
                 "Try browsing popular articles or reading more content to help me understand your preferences better.",
        articles: []
      };
    }

    // Get user's top interests
    const topCategories = this.preferenceAnalyzer.getCategoryPreferences(userId).slice(0, 2);
    const categoryNames = topCategories.map(c => c.category).join(' and ');

    return this.formatRecommendations(
      recommendations, 
      `Based on your interest in ${categoryNames}, here are some articles you might enjoy:`
    );
  }

  /**
   * Handle feedback from user
   */
  private handleFeedback(userId: string, message: string, sessionId: string): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    // Determine feedback type
    let feedbackType: FeedbackType;
    if (lowerMessage.includes('like') && !lowerMessage.includes('dislike')) {
      feedbackType = 'like';
    } else if (lowerMessage.includes('dislike')) {
      feedbackType = 'dislike';
    } else if (lowerMessage.includes('reject') || lowerMessage.includes('not interested')) {
      feedbackType = 'rejected';
    } else {
      return {
        message: "I'm not sure what kind of feedback you're providing. You can say 'like', 'dislike', or 'reject'."
      };
    }

    // Try to resolve article reference
    const articleId = this.resolveArticleReference(message, sessionId);
    
    if (!articleId) {
      return {
        message: "I'm not sure which article you're referring to. Could you be more specific?"
      };
    }

    // Store feedback
    this.feedbackRepo.store({
      userId,
      articleId,
      feedbackType,
      timestamp: new Date(),
      sessionId
    });

    // Update user profile with feedback
    const article = this.articleRepo.findById(articleId);
    if (article) {
      const profile = this.preferenceAnalyzer.buildUserProfile(userId);
      if (feedbackType === 'like' || feedbackType === 'dislike') {
        this.preferenceAnalyzer.updateProfileWithFeedback(
          profile,
          article.category,
          article.tags,
          feedbackType
        );
      }
    }

    const feedbackMessages = {
      'like': "Thanks for the feedback! I'll recommend more articles like this one.",
      'dislike': "Thanks for letting me know. I'll avoid recommending similar articles in the future.",
      'rejected': "Noted. I'll adjust my recommendations accordingly.",
      'viewed': "Article added to your history."
    };

    return {
      message: feedbackMessages[feedbackType]
    };
  }

  /**
   * Handle article details request
   */
  private handleArticleDetailsRequest(userId: string, message: string, sessionId: string): ChatResponse {
    const articleId = this.resolveArticleReference(message, sessionId);
    
    if (!articleId) {
      return {
        message: "I'm not sure which article you're asking about. Could you be more specific?"
      };
    }

    return this.explainRecommendation(userId, articleId);
  }

  /**
   * Handle similar articles request
   */
  private handleSimilarArticlesRequest(_userId: string, message: string, sessionId: string): ChatResponse {
    const articleId = this.resolveArticleReference(message, sessionId);
    
    if (!articleId) {
      return {
        message: "I'm not sure which article you want similar articles for. Could you be more specific?"
      };
    }

    const similarArticles = this.recommendationEngine.findSimilarArticles(articleId, 3);

    if (similarArticles.length === 0) {
      return {
        message: "I couldn't find any similar articles at the moment."
      };
    }

    // Track recommended articles in session
    similarArticles.forEach(article => {
      this.sessionManager.addRecommendedArticle(sessionId, article.id);
    });

    return this.formatRecommendations(similarArticles, "Here are some similar articles:");
  }

  /**
   * Resolve article reference from message using session context
   */
  private resolveArticleReference(message: string, sessionId: string): string | null {
    // Try to resolve using session manager
    const resolved = this.sessionManager.resolveReference(sessionId, message);
    if (resolved) {
      return resolved;
    }

    // Try to extract article ID directly from message
    const idMatch = message.match(/article[:\s]+([a-zA-Z0-9-]+)/i);
    if (idMatch) {
      return idMatch[1];
    }

    return null;
  }

  /**
   * Get user's viewing history with pagination
   * @param userId - The user ID
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 10)
   * @returns ChatResponse with formatted history
   */
  getHistory(userId: string, page: number = 1, pageSize: number = 10): ChatResponse {
    const history = this.userHistoryRepo.getHistoryPaginated(userId, page, pageSize);
    const totalCount = this.userHistoryRepo.getHistoryCount(userId);

    if (totalCount === 0) {
      return {
        message: "You haven't viewed any articles yet. Would you like some recommendations to get started?"
      };
    }

    // Format history entries
    const formattedEntries = history.map((view, index) => {
      const article = this.articleRepo.findById(view.articleId);
      const title = article?.title || `Article ${view.articleId}`;
      const viewDate = view.viewedAt.toLocaleDateString();
      
      return `${(page - 1) * pageSize + index + 1}. ${title}\n   Category: ${view.category}\n   Viewed: ${viewDate}`;
    });

    const totalPages = Math.ceil(totalCount / pageSize);
    const paginationInfo = totalPages > 1 
      ? `\n\nShowing page ${page} of ${totalPages}. ${totalCount} total articles.`
      : `\n\n${totalCount} total articles.`;

    return {
      message: `Your viewing history:\n\n${formattedEntries.join('\n\n')}${paginationInfo}`,
      articles: history.map(v => this.articleRepo.findById(v.articleId)).filter(a => a !== null) as Article[]
    };
  }

  /**
   * Format recommendations for display
   */
  private formatRecommendations(articles: Article[], prefix: string = "Here are some recommendations for you:"): ChatResponse {
    if (articles.length === 0) {
      return {
        message: "I don't have any recommendations available right now.",
        articles: []
      };
    }

    const formattedArticles = articles.map((article, index) => {
      return `${index + 1}. ${article.title}\n   by ${article.author}\n   ${article.summary}`;
    });

    return {
      message: `${prefix}\n\n${formattedArticles.join('\n\n')}`,
      articles
    };
  }

  /**
   * Explain why an article was recommended
   * @param userId - The user ID
   * @param articleId - The article ID
   * @returns ChatResponse with explanation
   */
  explainRecommendation(userId: string, articleId: string): ChatResponse {
    const article = this.articleRepo.findById(articleId);
    
    if (!article) {
      return {
        message: "I couldn't find that article."
      };
    }

    // Get user's viewing history to explain connection
    const userHistory = this.userHistoryRepo.getRecentHistory(userId, 30);

    // Build explanation
    let explanation = `**${article.title}**\n\n`;
    explanation += `Author: ${article.author}\n`;
    explanation += `Published: ${article.publicationDate.toLocaleDateString()}\n`;
    explanation += `Category: ${article.category}\n\n`;
    explanation += `Summary: ${article.summary}\n\n`;

    // Explain connection to viewing history
    if (userHistory.length > 0) {
      explanation += "**Why this recommendation?**\n";
      
      // Check for category match
      const categoryViews = userHistory.filter(v => v.category === article.category);
      if (categoryViews.length > 0) {
        explanation += `- You've viewed ${categoryViews.length} articles in the ${article.category} category\n`;
      }

      // Check for tag matches
      const userTags = new Set(userHistory.flatMap(v => v.tags));
      const matchingTags = article.tags.filter(tag => userTags.has(tag));
      if (matchingTags.length > 0) {
        explanation += `- This article has tags you're interested in: ${matchingTags.join(', ')}\n`;
      }

      // Mention top preferences
      const topCategories = this.preferenceAnalyzer.getCategoryPreferences(userId).slice(0, 3);
      if (topCategories.length > 0) {
        const categoryNames = topCategories.map(c => c.category).join(', ');
        explanation += `- Based on your reading history, you prefer: ${categoryNames}\n`;
      }
    }

    return {
      message: explanation,
      articles: [article]
    };
  }

  /**
   * Handle general conversation using Gemini AI
   */
  private async handleGeneralConversation(userId: string, message: string, sessionId: string): Promise<ChatResponse> {
    // If Gemini is not configured, use default response
    console.log('handleGeneralConversation called');
    console.log('geminiService exists:', !!this.geminiService);
    console.log('geminiService.isConfigured():', this.geminiService?.isConfigured());
    
    if (!this.geminiService || !this.geminiService.isConfigured()) {
      console.log('Gemini not configured, using fallback');
      return {
        message: "I can help you with:\n" +
                 "- View your article history\n" +
                 "- Get personalized recommendations\n" +
                 "- Learn more about specific articles\n" +
                 "- Provide feedback on articles\n\n" +
                 "What would you like to do?"
      };
    }
    
    console.log('Gemini is configured, generating response...');

    try {
      // Build context from conversation history
      const session = this.sessionManager.getSession(sessionId);
      let context = "You are Donna, a friendly and knowledgeable article recommendation assistant. ";
      
      if (session && session.conversationContext.length > 0) {
        context += "Recent conversation:\n";
        const recentExchanges = session.conversationContext.slice(-5);
        recentExchanges.forEach(ex => {
          context += `User: ${ex.userMessage}\nDonna: ${ex.botResponse}\n`;
        });
        context += "\n";
      }

      // Add user's reading history context
      const historyCount = this.userHistoryRepo.getHistoryCount(userId);
      context += `The user has viewed ${historyCount} articles so far.\n`;

      context += "\nYour capabilities:\n" +
                 "- Help users discover articles on topics they're interested in\n" +
                 "- View their article reading history\n" +
                 "- Provide personalized recommendations based on their reading history\n" +
                 "- Have conversations to refine what users want to read about\n" +
                 "- Answer questions about articles\n" +
                 "- Accept feedback on articles\n\n" +
                 "CRITICAL INSTRUCTIONS:\n" +
                 "1. When a user mentions a broad topic (like 'Abraham Lincoln', 'pollution', 'AI'), ask them what specific aspect they want to explore.\n" +
                 "   Example: 'Abraham Lincoln is fascinating! What aspect interests you most? His childhood, presidency, leadership style, or something else?'\n" +
                 "2. When they specify an aspect (like 'his childhood', 'his presidency'), respond with: 'Great choice! Let me search for articles about [topic].' and STOP.\n" +
                 "   DO NOT list articles yourself - the system will automatically search and display clickable article cards.\n" +
                 "3. NEVER create fake article titles or descriptions. The system handles article search and display.\n" +
                 "4. Be conversational and help users refine their interests through questions.\n" +
                 "5. If they explicitly say 'give me articles' or 'show me articles', acknowledge and let the system handle it.\n" +
                 "6. Keep responses friendly and natural.";

      // First, have Gemini generate a conversational response
      console.log('💬 Generating conversational response...');
      const aiResponse = await this.geminiService.generateResponse(message, context);
      console.log('AI Response:', aiResponse.substring(0, 100));
      
      // Check if Gemini indicated it's time to search for articles
      const shouldSearchArticles = 
        aiResponse.toLowerCase().includes('let me search') ||
        aiResponse.toLowerCase().includes("i'll search") ||
        aiResponse.toLowerCase().includes("i'll find") ||
        aiResponse.toLowerCase().includes('searching for');
      
      console.log('shouldSearchArticles:', shouldSearchArticles);
      
      if (shouldSearchArticles) {
        // Extract the topic from Gemini's response (it says "Let me search for articles about X")
        let searchTopic = message; // Default to user's message
        
        // Try to extract topic from Gemini's response
        const aboutMatch = aiResponse.match(/about\s+(.+?)(?:\.|$)/i);
        if (aboutMatch) {
          searchTopic = aboutMatch[1].trim();
          console.log('✅ Extracted topic from AI response:', searchTopic);
        } else {
          // Fallback: try to build from conversation context
          const recentContext = session?.conversationContext.slice(-3) || [];
          
          console.log('📝 Fallback: extracting from conversation context');
          let mainTopic = '';
          
          // Look for the main topic in recent messages
          for (const ex of recentContext) {
            const userMsg = ex.userMessage.toLowerCase();
            // Skip short responses
            if (userMsg.length > 5 && !['yes', 'no', 'ok', 'sure', 'yeah', 'their', 'his', 'her', 'its'].includes(userMsg.trim())) {
              mainTopic = ex.userMessage;
              break;
            }
          }
          
          // Combine main topic with current message
          if (mainTopic && !message.toLowerCase().includes(mainTopic.toLowerCase().split(' ')[0])) {
            searchTopic = `${mainTopic} ${message}`;
          }
          
          console.log('🎯 Main topic from context:', mainTopic);
          console.log('🎯 Current message:', message);
        }
        
        console.log('🔍 Final search topic:', searchTopic);
        try {
          const articles = await this.geminiService.searchArticles(searchTopic, 5);
          console.log('✅ Found articles:', articles.length);
          
          // Store articles in repository
          articles.forEach((article: Article) => this.articleRepo.store(article));
          
          // Track recommended articles in session
          articles.forEach((article: Article) => {
            this.sessionManager.addRecommendedArticle(sessionId, article.id);
          });
          
          const response = this.formatRecommendations(
            articles,
            aiResponse // Use Gemini's response as the prefix
          );
          console.log('📤 Returning response with', response.articles?.length, 'articles');
          return response;
        } catch (error) {
          console.error('❌ Error searching for articles:', error);
          return {
            message: aiResponse + `\n\nI encountered an issue searching. You can try using the 🔍 Search Web button.`
          };
        }
      }
      
      // Otherwise, just return the conversational response
      return {
        message: aiResponse
      };
    } catch (error) {
      console.error('Error generating conversational response:', error);
      // Fallback to default response
      return {
        message: "I can help you with:\n" +
                 "- View your article history\n" +
                 "- Get personalized recommendations\n" +
                 "- Learn more about specific articles\n" +
                 "- Provide feedback on articles\n\n" +
                 "What would you like to do?"
      };
    }
  }
}
