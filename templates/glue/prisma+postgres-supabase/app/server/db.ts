/**
 * Database server interface — real implementation for Prisma + Supabase's
 * direct Postgres connection.
 *
 * Replaces the base template's throwing stub. The only provider SDK
 * imports in the whole generated app live here (and in
 * `app/server/auth.ts`, for the auth provider, and `app/server/
 * supabase-client.ts` for the shared Supabase client) — every route
 * reaches the database only through the helpers exported below, never by
 * importing `@prisma/client` directly.
 *
 * Standard `prisma-client-js` generator, same driver-free story as
 * `prisma+postgres-docker` — Supabase's direct connection string is a
 * normal Postgres wire-protocol connection, not Neon's HTTP/serverless
 * protocol, so no `@prisma/adapter-neon`-style wiring is needed here.
 */
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

/**
 * Tells the dialect-agnostic `app/server/auth.ts` (shipped by the
 * `better-auth+prisma` glue fragment, shared across every database/host
 * combination) which Better Auth Prisma-adapter dialect to speak.
 */
export const dbProvider = "postgresql" as const;

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export async function listNotes(userId: string): Promise<Note[]> {
  return db.note.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createNote(userId: string, title: string, content: string): Promise<void> {
  await db.note.create({ data: { id: crypto.randomUUID(), userId, title, content } });
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await db.note.deleteMany({ where: { id, userId } });
}
