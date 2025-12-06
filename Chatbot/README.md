# Article Recommendation Chatbot

A conversational AI system that provides personalized article recommendations based on user viewing history.

## 🚀 Getting Started

### Quick Start (Sample Data Only)

```bash
npm start
```

The server will start at **http://localhost:3000**

Open your browser and visit: **http://localhost:3000**

### 🔍 Enable Web Search with Gemini AI (Recommended)

To search for real articles from the web:

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file in the root directory
3. Add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Restart the server: `npm start`

See [GEMINI_SETUP.md](GEMINI_SETUP.md) for detailed instructions.

## 💬 How to Use

### Quick Actions
- **📚 My History** - View your article reading history
- **✨ Get Recommendations** - Get personalized article recommendations
- **🔍 Search Web** - Search for real articles using Gemini AI (requires API key)
- **ℹ️ Article Details** - Learn more about specific articles

### Chat Commands

You can type natural language messages like:

- "Show my history"
- "Recommend some articles"
- "Tell me more about this article"
- "I like this article"
- "I dislike this"
- "Show me similar articles"

### Viewing Articles

Click on any article card to add it to your viewing history. The system will use this to personalize future recommendations.

## 🎯 Features Implemented

✅ **Chatbot Interface** - Natural language conversation
✅ **Web Search with Gemini AI** - Search for real articles from the web
✅ **History Display** - View your reading history with pagination
✅ **Personalized Recommendations** - Get 3+ article suggestions based on your interests
✅ **Article Details** - See full information and explanation for recommendations
✅ **Feedback System** - Like/dislike articles to improve recommendations
✅ **Session Management** - Maintains conversation context
✅ **Reference Resolution** - Understands "this article", "that one", etc.

## 📊 Sample Data

The system comes pre-loaded with 8 sample articles across different categories:
- Technology (Machine Learning, Web Development, Quantum Computing)
- Science (Renewable Energy, Climate Change, Biodiversity)
- Data Science (Data Visualization)

## 🛠️ Technical Stack

- **Backend**: Node.js with TypeScript
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Server**: Native HTTP server
- **Testing**: Vitest + fast-check (property-based testing)

## 📝 Development

### Run Tests
```bash
npm test
```

### Build
```bash
npm run build
```

## 🎨 UI Features

- Modern gradient design
- Smooth animations
- Responsive layout
- Article cards with metadata
- Real-time chat interface
- Quick action buttons

Enjoy exploring personalized article recommendations! 🤖✨
