import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modelsTable } from "./models";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => modelsTable.id),
  clientToken: text("client_token").notNull(),
  senderRole: varchar("sender_role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
