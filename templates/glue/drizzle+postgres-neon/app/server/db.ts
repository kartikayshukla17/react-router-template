/**
 * Database server interface — real implementation for Drizzle + Neon.
 *
 * Replaces the base template's throwing stub. The only provider SDK imports
 * in the whole generated app live here (and in `app/server/auth.ts`, for
 * the auth provider) — every route reaches the database only through the
 * helpers exported below, never by importing `drizzle-orm` or
 * `@neondatabase/serverless` directly.
 *
 * Hard-coded against the Neon serverless HTTP driver: this `drizzle+
 * postgres-neon` glue fragment is only ever scaffolded when `postgresHost`
 * is `neon`. The Docker host gets its own sibling fragment,
 * `drizzle+postgres-docker`, wired against a plain TCP `postgres` client
 * instead — same shape, different driver, since Neon's HTTP/serverless
 * wire protocol doesn't work against a normal Postgres server.
 */
import { neon } from "@neondatabase/serverless";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { notes } from "../db/schema.js";

const sql = neon(process.env.DATABASE_URL ?? "");

export const db = drizzle({ client: sql });

/**
 * Tells the dialect-agnostic `app/server/auth.ts` (shipped by the
 * `better-auth+drizzle` glue fragment, shared across every database/host
 * combination) which Better Auth Drizzle-adapter dialect to speak.
 */
export const dbProvider = "pg" as const;

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
