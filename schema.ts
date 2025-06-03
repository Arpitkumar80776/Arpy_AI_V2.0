import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  title: text("title"),
  messages: json("messages").$type<Message[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const Message = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant']),
  timestamp: z.number(),
  isVoice: z.boolean().optional(),
  feedback: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
    helpful: z.boolean().optional(),
    timestamp: z.number().optional(),
  }).optional(),
});

export type Message = z.infer<typeof Message>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const SignupRequestSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  sessionId: true,
  title: true,
  messages: true,
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string(),
  isVoice: z.boolean().optional(),
});

export const FeedbackRequestSchema = z.object({
  messageId: z.string(),
  sessionId: z.string(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  helpful: z.boolean().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
