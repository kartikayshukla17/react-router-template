/**
 * Starter Drizzle schema for the demo `/notes` route — SQLite flavor of
 * `orm/drizzle`'s Postgres `app/db/schema.ts` (now shipped per-dialect by
 * the `drizzle+<host>`/`drizzle+sqlite` glue fragments instead of by the
 * `orm/drizzle` provider itself, since the column types genuinely differ:
 * `drizzle-orm/sqlite-core`'s `sqliteTable`/`integer` instead of
 * `drizzle-orm/pg-core`'s `pgTable`/`timestamp`).
 *
 * `userId` stores the auth provider's user id as plain text, not a foreign
 * key — per PRD.md's documented tradeoff, there's no user-sync table for
 * third-party auth in v1, so this schema stays correct even if a
 * non-Drizzle-backed auth provider is swapped in later.
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
