/**
 * Database server interface — real implementation for Drizzle + a local
 * SQLite file.
 *
 * Replaces the base template's throwing stub. The only provider SDK imports
 * in the whole generated app live here (and in `app/server/auth.ts`, for
 * the auth provider) — every route reaches the database only through the
 * helpers exported below, never by importing `drizzle-orm` or
 * `better-sqlite3` directly.
 *
 * Uses `better-sqlite3` via `drizzle-orm/better-sqlite3` rather than
 * `@libsql/client` — Drizzle's own "Get Started: SQLite" guide leads with
 * `better-sqlite3` for a plain local file, it's a synchronous API (no
 * connection/async-init ceremony for a file that's just sitting on disk),
 * and libSQL's client is really aimed at Turso's remote/embedded-replica
 * story, which this zero-account, zero-Docker option has no use for.
 *
 * The file lives at `<project root>/sqlite.db`, computed with `node:path`
 * (not string-concatenated) so it resolves correctly on Windows too.
 */
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import { notes } from "../db/schema.js";

const sqlite = new Database(path.join(process.cwd(), "sqlite.db"));
sqlite.pragma("journal_mode = WAL");

export const db = drizzle({ client: sqlite });

/**
 * Tells the dialect-agnostic `app/server/auth.ts` (shipped by the
 * `better-auth+drizzle` glue fragment, shared across every database/host
 * combination) which Better Auth Drizzle-adapter dialect to speak.
 */
export const dbProvider = "sqlite" as const;

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export async function listNotes(userId: string): Promise<Note[]> {
  return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
}

export async function createNote(userId: string, title: string, content: string): Promise<void> {
  await db.insert(notes).values({ id: crypto.randomUUID(), userId, title, content });
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
}
