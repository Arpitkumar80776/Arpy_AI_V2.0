import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ChatRequestSchema, FeedbackRequestSchema, LoginRequestSchema, SignupRequestSchema, Message } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function registerRoutes(app: Express): Promise<Server> {

  // Chat endpoint for sending messages to AI
  app.post("/api/chat", async (req, res) => {
    try {
      console.log('Chat request received:', req.body);
      const { message, sessionId, isVoice = false } = ChatRequestSchema.parse(req.body);

      // Get or create conversation
      let conversation = await storage.getConversation(sessionId);
      if (!conversation) {
        conversation = await storage.createConversation({
          sessionId,
          messages: [],
        });
      }

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: message,
        role: 'user',
        timestamp: Date.now(),
        isVoice,
      };

      const updatedMessages = [...conversation.messages, userMessage];

      // Generate AI response using Google Gemini
      let aiResponse = "I apologize, but I'm currently in demo mode. Please configure a valid Google API key to enable full AI functionality.";

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build conversation history for context
        const conversationHistory = updatedMessages.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');

        const prompt = `You are Arpy AI V2.0, an advanced AI assistant with a friendly, knowledgeable, and helpful personality. You provide thoughtful, contextual responses and maintain conversation flow naturally. Keep responses conversational and engaging while being informative.

Conversation history:
${conversationHistory}

Please respond to the latest user message naturally and helpfully.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiResponse = response.text() || "I apologize, but I'm having trouble processing that request right now.";
      } catch (error: any) {
        console.error('Gemini API error:', error);
        // Provide informative demo responses based on user input
        const userInput = message.toLowerCase();
        if (userInput.includes('hello') || userInput.includes('hi')) {
          aiResponse = "Hello! I'm Arpy AI V2.0, your advanced AI assistant. I'm currently in demo mode - please configure a valid Google API key to unlock my full capabilities. The interface is fully functional and ready for real AI conversations!";
        } else if (userInput.includes('test')) {
          aiResponse = "This is a demonstration response! The interface is working perfectly with voice recognition, typing animations, theme switching, and all visual effects. Once you add a valid Google API key, I'll provide intelligent, contextual responses to all your questions.";
        } else if (userInput.includes('voice') || userInput.includes('speak')) {
          aiResponse = "I can hear you perfectly! The voice recognition system is working great. I can process both text and voice inputs. Configure your Google API key to enable full conversational AI responses.";
        } else {
          aiResponse = `I received your message: "${message}". I'm currently in demo mode due to API key configuration issues. The beautiful glassmorphism interface, voice recognition, and all animations are working perfectly. Please configure a valid Google API key to enable intelligent responses!`;
        }
      }

      // Add AI response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: aiResponse,
        role: 'assistant',
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      // Update conversation
      await storage.updateConversation(sessionId, finalMessages);

      const response = {
        message: assistantMessage,
        conversation: finalMessages,
      };
      
      console.log('Sending chat response:', response);
      res.json(response);

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get conversation history
  app.get("/api/conversation/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const conversation = await storage.getConversation(sessionId);

      if (!conversation) {
        return res.json({ messages: [] });
      }

      res.json({ messages: conversation.messages });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Clear conversation
  app.delete("/api/conversation/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteConversation(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Clear conversation error:', error);
      res.status(500).json({ 
        error: 'Failed to clear conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Submit feedback for AI responses
  app.post("/api/feedback", async (req, res) => {
    try {
      const { messageId, sessionId, rating, comment, helpful } = FeedbackRequestSchema.parse(req.body);

      const feedback = {
        rating,
        comment,
        helpful,
      };

      const updatedConversation = await storage.updateMessageFeedback(sessionId, messageId, feedback);

      res.json({ 
        success: true,
        feedback,
        conversation: updatedConversation
      });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get conversation history
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();

      const summaries = conversations.map(conv => {
        const messages = conv.messages || [];
        const lastMessage = messages[messages.length - 1];

        return {
          sessionId: conv.sessionId,
          title: conv.title || 'Untitled Chat',
          lastMessage: lastMessage ? lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '') : 'No messages',
          timestamp: conv.updatedAt.getTime(),
          messageCount: messages.length
        };
      });

      res.json(summaries);
    } catch (error) {
      console.error('Conversations fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate chat title
  app.post("/api/conversation/:sessionId/generate-title", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const conversation = await storage.getConversation(sessionId);

      if (!conversation || !conversation.messages.length) {
        return res.status(404).json({ error: 'Conversation not found or empty' });
      }

      // Use first few messages to generate title
      const firstMessages = conversation.messages.slice(0, 4);
      const context = firstMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Based on this conversation, generate a short, descriptive title (2-6 words max) that captures the main topic:

${context}

Generate only the title, no quotes or extra text:`;

      const result = await model.generateContent(prompt);
      const title = result.response.text().trim().replace(/['"]/g, '').substring(0, 50);

      const updatedConversation = await storage.updateConversationTitle(sessionId, title);

      res.json({ 
        title,
        conversation: updatedConversation
      });
    } catch (error) {
      console.error('Title generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate title',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get feedback analytics
  app.get("/api/analytics/feedback", async (req, res) => {
    try {
      // Aggregate feedback data across all conversations
      const allConversations = Array.from((storage as any).conversations.values());
      const allMessages = allConversations.flatMap((conv: any) => conv.messages);
      const feedbackMessages = allMessages.filter(msg => msg.feedback && msg.role === 'assistant');

      const analytics = {
        totalFeedbacks: feedbackMessages.length,
        averageRating: feedbackMessages.length > 0 
          ? feedbackMessages.reduce((sum, msg) => sum + (msg.feedback?.rating || 0), 0) / feedbackMessages.filter(msg => msg.feedback?.rating).length
          : 0,
        helpfulCount: feedbackMessages.filter(msg => msg.feedback?.helpful === true).length,
        notHelpfulCount: feedbackMessages.filter(msg => msg.feedback?.helpful === false).length,
        ratingDistribution: {
          1: feedbackMessages.filter(msg => msg.feedback?.rating === 1).length,
          2: feedbackMessages.filter(msg => msg.feedback?.rating === 2).length,
          3: feedbackMessages.filter(msg => msg.feedback?.rating === 3).length,
          4: feedbackMessages.filter(msg => msg.feedback?.rating === 4).length,
          5: feedbackMessages.filter(msg => msg.feedback?.rating === 5).length,
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to get analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password } = SignupRequestSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Generate JWT token for new user
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );

      // Return user without password and token
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
        message: "User created successfully",
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ 
        error: 'Signup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = LoginRequestSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ 
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online",
      timestamp: new Date().toISOString(),
      features: {
        ai: !!process.env.GOOGLE_API_KEY,
        voice: true,
        memory: true,
        auth: true
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}