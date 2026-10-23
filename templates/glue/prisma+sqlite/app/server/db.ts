/**
 * Database server interface — real implementation for Prisma + a local
 * SQLite file.
 *
 * Replaces the base template's throwing stub. The only provider SDK
 * imports in the whole generated app live here (and in
 * `app/server/auth.ts`, for the auth provider) — every route reaches the
 * database only through the helpers exported below, never by importing
 * `@prisma/client` directly.
 *
 * No driver adapter needed — verified empirically (2026-10-23) against
 * Prisma 6.19.3: the standard `prisma-client-js` generator's own query
 * engine talks to a local SQLite file directly, with no `@prisma/
 * adapter-better-sqlite3`-style wiring required for this demo's plain
 * single-file use. The file path itself (`<project root>/sqlite.db`) is
 * fixed in `prisma/schema/schema.prisma`'s `datasource` block, not here —
 * `PrismaClient` needs no connection argument.
 */
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

/**
 * Tells the dialect-agnostic `app/server/auth.ts` (shipped by the
 * `better-auth+prisma` glue fragment, shared across every database/host
 * combination) which Better Auth Prisma-adapter dialect to speak.
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
  return db.note.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createNote(userId: string, title: string, content: string): Promise<void> {
  await db.note.create({ data: { id: crypto.randomUUID(), userId, title, content } });
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await db.note.deleteMany({ where: { id, userId } });
}
