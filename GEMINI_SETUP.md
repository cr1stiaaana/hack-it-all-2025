# 🔍 Gemini API Integration Setup

This guide will help you set up the Google Gemini API to search for real articles from the web.

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key

## Step 2: Configure Your Environment

1. Create a `.env` file in the root directory of your project:
   ```bash
   # On Windows (PowerShell)
   New-Item .env
   
   # Or just create it manually
   ```

2. Open the `.env` file and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Save the file

## Step 3: Restart the Server

Stop the current server (Ctrl+C) and restart it:
```bash
npm start
```

You should see the server start successfully.

## Step 4: Test the Search Feature

1. Open your browser to `http://localhost:3000`
2. Click the **🔍 Search Web** button
3. Enter a topic like:
   - "artificial intelligence"
   - "climate change"
   - "space exploration"
   - "quantum computing"
4. Click **Search**

The chatbot will use Gemini AI to search for real, recent articles about your topic!

## Features

✅ **Web Search** - Find real articles from the web using Gemini AI
✅ **Smart Parsing** - Gemini extracts article details (title, author, summary, etc.)
✅ **Auto-Storage** - Found articles are automatically added to your database
✅ **Personalized Recommendations** - The system learns from articles you view

## Troubleshooting

### "Gemini API not configured" Error
- Make sure you created the `.env` file in the root directory
- Check that your API key is correct
- Restart the server after adding the API key

### No Articles Found
- Try a different search topic
- Make sure your API key is valid
- Check your internet connection

### API Rate Limits
- Free tier has rate limits
- If you hit limits, wait a few minutes and try again

## How It Works

1. **User searches** for a topic (e.g., "machine learning")
2. **Gemini AI** searches and generates article information
3. **Articles are parsed** and converted to the proper format
4. **Articles are stored** in the repository
5. **User can view** and interact with the articles
6. **System learns** from your interactions for better recommendations

## Next Steps

- Search for topics you're interested in
- Click on articles to add them to your history
- Get personalized recommendations based on what you've read
- Provide feedback (like/dislike) to improve suggestions

Enjoy your AI-powered article recommendation chatbot! 🤖✨
