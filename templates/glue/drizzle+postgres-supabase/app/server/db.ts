/**
 * Database server interface — real implementation for Drizzle + Supabase's
 * direct Postgres connection.
 *
 * Replaces the base template's throwing stub. The only provider SDK
 * imports in the whole generated app live here (and in
 * `app/server/auth.ts`, for the auth provider, and `app/server/
 * supabase-client.ts` for the shared Supabase client) — every route
 * reaches the database only through the helpers exported below, never by
 * importing `drizzle-orm` or `postgres` directly.
 *
 * Uses the `postgres` package (postgres.js) over a plain TCP connection via
 * `drizzle-orm/postgres-js`, same driver family as
 * `drizzle+postgres-docker` — Supabase's direct connection string is a
 * normal Postgres wire-protocol connection, not its PostgREST/HTTP API, so
 * it needs the same driver as any other self-hosted Postgres server
 * rather than Neon's HTTP/serverless driver.
 */
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { notes } from "../db/schema.js";

const sql = postgres(process.env.DATABASE_URL ?? "");

export const db = drizzle({ client: sql });

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
