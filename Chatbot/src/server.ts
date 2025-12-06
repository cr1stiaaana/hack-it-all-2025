import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ChatbotInterface } from './services/ChatbotInterface';
import { ArticleRepository } from './repositories/ArticleRepository';
import { UserHistoryRepository } from './repositories/UserHistoryRepository';
import { FeedbackRepository } from './repositories/FeedbackRepository';
import { RecommendationEngine } from './services/RecommendationEngine';
import { SessionManager } from './services/SessionManager';
import { PreferenceAnalyzer } from './services/PreferenceAnalyzer';
import { SimilarityCalculator } from './services/SimilarityCalculator';
import { GeminiService } from './services/GeminiService';
import { Article } from './models/Article';

// Load environment variables
dotenv.config();

// Initialize repositories and services
const articleRepo = new ArticleRepository();
const userHistoryRepo = new UserHistoryRepository();
const feedbackRepo = new FeedbackRepository();
const preferenceAnalyzer = new PreferenceAnalyzer(userHistoryRepo, feedbackRepo);
const similarityCalculator = new SimilarityCalculator();
const recommendationEngine = new RecommendationEngine(articleRepo, preferenceAnalyzer, similarityCalculator);
const sessionManager = new SessionManager();

// Initialize Gemini service
const apiKey = process.env.GEMINI_API_KEY;
console.log('Gemini API Key configured:', apiKey ? 'Yes' : 'No');
if (apiKey) {
  console.log('API Key starts with:', apiKey.substring(0, 10) + '...');
}
const geminiService = new GeminiService(apiKey);

const chatbot = new ChatbotInterface(
  articleRepo,
  userHistoryRepo,
  feedbackRepo,
  recommendationEngine,
  sessionManager,
  preferenceAnalyzer,
  geminiService
);

// Add sample data
function initializeSampleData() {
  const sampleArticles: Article[] = [
    {
      id: 'art-1',
      title: 'Introduction to Machine Learning',
      author: 'Dr. Sarah Chen',
      publicationDate: new Date('2024-01-15'),
      category: 'Technology',
      summary: 'A comprehensive guide to understanding the basics of machine learning and its applications.',
      content: 'Machine learning is a subset of artificial intelligence...',
      tags: ['AI', 'Machine Learning', 'Technology'],
      likeCount: 45,
      dislikeCount: 3,
      metadata: { difficulty: 'beginner' }
    },
    {
      id: 'art-2',
      title: 'The Future of Renewable Energy',
      author: 'James Wilson',
      publicationDate: new Date('2024-02-01'),
      category: 'Science',
      summary: 'Exploring the latest developments in solar and wind energy technologies.',
      content: 'Renewable energy sources are becoming increasingly important...',
      tags: ['Energy', 'Environment', 'Sustainability'],
      likeCount: 67,
      dislikeCount: 5,
      metadata: { difficulty: 'intermediate' }
    },
    {
      id: 'art-3',
      title: 'Deep Learning Neural Networks',
      author: 'Dr. Sarah Chen',
      publicationDate: new Date('2024-02-10'),
      category: 'Technology',
      summary: 'Advanced concepts in neural networks and deep learning architectures.',
      content: 'Deep learning has revolutionized the field of AI...',
      tags: ['AI', 'Deep Learning', 'Neural Networks'],
      likeCount: 89,
      dislikeCount: 7,
      metadata: { difficulty: 'advanced' }
    },
    {
      id: 'art-4',
      title: 'Climate Change and Global Policy',
      author: 'Maria Rodriguez',
      publicationDate: new Date('2024-01-20'),
      category: 'Science',
      summary: 'An analysis of international efforts to combat climate change.',
      content: 'Climate change remains one of the most pressing issues...',
      tags: ['Climate', 'Environment', 'Policy'],
      likeCount: 52,
      dislikeCount: 12,
      metadata: { difficulty: 'intermediate' }
    },
    {
      id: 'art-5',
      title: 'Web Development Best Practices',
      author: 'Alex Kumar',
      publicationDate: new Date('2024-02-15'),
      category: 'Technology',
      summary: 'Essential practices for building modern, scalable web applications.',
      content: 'Modern web development requires understanding of various technologies...',
      tags: ['Web Development', 'Programming', 'Best Practices'],
      likeCount: 73,
      dislikeCount: 4,
      metadata: { difficulty: 'intermediate' }
    },
    {
      id: 'art-6',
      title: 'The Art of Data Visualization',
      author: 'Emily Zhang',
      publicationDate: new Date('2024-01-25'),
      category: 'Data Science',
      summary: 'Techniques for creating compelling and informative data visualizations.',
      content: 'Data visualization is crucial for communicating insights...',
      tags: ['Data Science', 'Visualization', 'Analytics'],
      likeCount: 61,
      dislikeCount: 2,
      metadata: { difficulty: 'beginner' }
    },
    {
      id: 'art-7',
      title: 'Quantum Computing Explained',
      author: 'Dr. Michael Brown',
      publicationDate: new Date('2024-02-05'),
      category: 'Technology',
      summary: 'Understanding the principles and potential of quantum computing.',
      content: 'Quantum computing represents a paradigm shift in computation...',
      tags: ['Quantum Computing', 'Technology', 'Physics'],
      likeCount: 94,
      dislikeCount: 8,
      metadata: { difficulty: 'advanced' }
    },
    {
      id: 'art-8',
      title: 'Biodiversity Conservation Strategies',
      author: 'James Wilson',
      publicationDate: new Date('2024-01-30'),
      category: 'Science',
      summary: 'Methods and approaches for preserving global biodiversity.',
      content: 'Biodiversity is essential for ecosystem health...',
      tags: ['Biology', 'Conservation', 'Environment'],
      likeCount: 48,
      dislikeCount: 3,
      metadata: { difficulty: 'intermediate' }
    }
  ];

  sampleArticles.forEach(article => articleRepo.store(article));
}

initializeSampleData();

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve static HTML
  if (req.url === '/' || req.url === '/index.html') {
    const htmlPath = path.join(__dirname, '../public/index.html');
    fs.readFile(htmlPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Serve avatar image
  if (req.url === '/donna-avatar.png') {
    const imagePath = path.join(__dirname, '../public/donna-avatar.png');
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Avatar not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(data);
    });
    return;
  }

  // API endpoint for chat
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { userId, message, sessionId } = JSON.parse(body);
        
        // Get or create session
        let session = sessionManager.getSession(sessionId);
        if (!session) {
          session = sessionManager.createSession(userId);
        }

        const response = await chatbot.processMessage(userId, message, session.sessionId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ...response,
          sessionId: session.sessionId
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // API endpoint to search articles with Gemini
  if (req.url === '/api/search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { topic, count } = JSON.parse(body);
        
        if (!geminiService.isConfigured()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Gemini API not configured. Please set GEMINI_API_KEY in .env file.' 
          }));
          return;
        }

        const articles = await geminiService.searchArticles(topic, count || 5);
        
        // Store articles in repository
        articles.forEach(article => articleRepo.store(article));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ articles }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Failed to search articles' }));
      }
    });
    return;
  }

  // API endpoint to view an article (adds to history)
  if (req.url?.startsWith('/api/view/') && req.method === 'POST') {
    const articleId = req.url.split('/api/view/')[1];
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { userId } = JSON.parse(body);
        const article = articleRepo.findById(articleId);
        
        if (article) {
          userHistoryRepo.addView(userId, {
            articleId: article.id,
            viewedAt: new Date(),
            category: article.category,
            tags: article.tags
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, article }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Article not found' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n👩‍💼 Donna - Article Assistant Server`);
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`\n✨ Open your browser and visit: http://localhost:${PORT}\n`);
});
