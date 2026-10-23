/**
 * Database server interface — real implementation for Drizzle + a
 * self-hosted Docker Postgres.
 *
 * Replaces the base template's throwing stub. The only provider SDK imports
 * in the whole generated app live here (and in `app/server/auth.ts`, for
 * the auth provider) — every route reaches the database only through the
 * helpers exported below, never by importing `drizzle-orm` or `postgres`
 * directly.
 *
 * Uses the `postgres` package (postgres.js) over a plain TCP connection via
 * `drizzle-orm/postgres-js` — the driver Drizzle's docs recommend for a
 * normal Postgres server. This `drizzle+postgres-docker` glue fragment is
 * only ever scaffolded when `postgresHost` is `docker`; the Neon host gets
 * its own sibling fragment, `drizzle+postgres-neon`, wired against Neon's
 * HTTP/serverless driver instead, since that driver doesn't speak the wire
 * protocol a plain Docker Postgres container expects.
 */
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { notes } from "../db/schema.js";

const sql = postgres(process.env.DATABASE_URL ?? "");

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
