import { pgTable, serial, integer, text, varchar, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const modelsTable = pgTable("models", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  artistName: text("artist_name").notNull(),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  pixKey: text("pix_key").notNull(),
  selfieUrl: text("selfie_url"),
  profilePhoto: text("profile_photo"),
  bio: text("bio"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isOnline: boolean("is_online").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  totalSales: integer("total_sales").notNull().default(0),
  profileViews: integer("profile_views").notNull().default(0),
  grossBalance: numeric("gross_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModelSchema = createInsertSchema(modelsTable).omit({ id: true, createdAt: true });
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof modelsTable.$inferSelect;
