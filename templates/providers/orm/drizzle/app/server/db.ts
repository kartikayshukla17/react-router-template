/**
 * Database server interface — real implementation for Drizzle + Neon.
 *
 * Replaces the base template's throwing stub. The only provider SDK imports
 * in the whole generated app live here (and in `app/server/auth.ts`, for
 * the auth provider) — every route reaches the database only through the
 * helpers exported below, never by importing `drizzle-orm` or
 * `@neondatabase/serverless` directly.
 *
 * Hard-coded against the Neon serverless HTTP driver: this fragment is only
 * ever scaffolded when `postgresHost` is `neon` (enforced by the resolver's
 * `drizzle-requires-neon-host` rule), so there's exactly one driver to wire
 * up today. A future Docker/Supabase-host ticket will need its own
 * host-specific `db.ts` fragment (a `drizzle+<host>` glue), not a change
 * here.
 */
import { neon } from "@neondatabase/serverless";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { notes } from "../db/schema.js";

const sql = neon(process.env.DATABASE_URL ?? "");

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
