/**
 * Starter Drizzle schema for the demo `/notes` route. `userId` stores the
 * auth provider's user id as plain text, not a foreign key — per PRD.md's
 * documented tradeoff, there's no user-sync table for third-party auth in
 * v1, so this schema stays correct even if a non-Drizzle-backed auth
 * provider is swapped in later.
 */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
