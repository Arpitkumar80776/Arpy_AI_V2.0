import { users, conversations, type User, type InsertUser, type Conversation, type InsertConversation, type Message } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getConversation(sessionId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(sessionId: string, messages: Message[]): Promise<Conversation>;
  updateConversationTitle(sessionId: string, title: string): Promise<Conversation>;
  deleteConversation(sessionId: string): Promise<void>;
  getAllConversations(): Promise<Conversation[]>;
  updateMessageFeedback(sessionId: string, messageId: string, feedback: any): Promise<Conversation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<string, Conversation>;
  private currentUserId: number;
  private currentConversationId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.currentUserId = 1;
    this.currentConversationId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversation(sessionId: string): Promise<Conversation | undefined> {
    return this.conversations.get(sessionId);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const conversation: Conversation = {
      id,
      sessionId: insertConversation.sessionId,
      title: insertConversation.title || null,
      messages: insertConversation.messages || [],
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(insertConversation.sessionId, conversation);
    return conversation;
  }

  async updateConversationTitle(sessionId: string, title: string): Promise<Conversation> {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const updatedConversation: Conversation = {
      ...conversation,
      title,
      updatedAt: new Date(),
    };

    this.conversations.set(sessionId, updatedConversation);
    return updatedConversation;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async updateConversation(sessionId: string, messages: Message[]): Promise<Conversation> {
    const existingConversation = this.conversations.get(sessionId);
    if (!existingConversation) {
      throw new Error('Conversation not found');
    }

    const updatedConversation: Conversation = {
      ...existingConversation,
      messages,
      updatedAt: new Date(),
    };

    this.conversations.set(sessionId, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(sessionId: string): Promise<void> {
    this.conversations.delete(sessionId);
  }

  async updateMessageFeedback(sessionId: string, messageId: string, feedback: any): Promise<Conversation> {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const updatedMessages = conversation.messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: { ...feedback, timestamp: Date.now() } }
        : msg
    );

    const updatedConversation: Conversation = {
      ...conversation,
      messages: updatedMessages,
      updatedAt: new Date(),
    };

    this.conversations.set(sessionId, updatedConversation);
    return updatedConversation;
  }
}

export const storage = new MemStorage();