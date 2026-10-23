/**
 * Database server interface — real implementation for Prisma + Neon.
 *
 * Replaces the base template's throwing stub. The only provider SDK
 * imports in the whole generated app live here (and in
 * `app/server/auth.ts`, for the auth provider) — every route reaches the
 * database only through the helpers exported below, never by importing
 * `@prisma/client` or `@prisma/adapter-neon` directly.
 *
 * Verified empirically (2026-10-23) against `@prisma/adapter-neon`
 * 6.19.3: `PrismaNeonHTTP` is Neon's HTTP-only driver-adapter class — no
 * `ws`/WebSocket dependency needed, since the demo's simple
 * single-document note operations never need a persistent pooled
 * connection or a multi-statement transaction. Mirrors
 * `drizzle+postgres-neon`'s choice of `drizzle-orm/neon-http` over Neon's
 * WebSocket pool driver, for the same reason. This `prisma+postgres-neon`
 * glue fragment is only ever scaffolded when `postgresHost` is `neon`; the
 * Docker/Supabase hosts get their own sibling fragments, wired against
 * Prisma's standard engine instead, since a plain Postgres server doesn't
 * speak Neon's HTTP/serverless protocol.
 */
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL ?? "", {});

export const db = new PrismaClient({ adapter });

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
