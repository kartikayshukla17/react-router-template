/**
 * Auth server interface — real implementation wiring Better Auth's
 * official Prisma adapter (`@better-auth/prisma-adapter`) to
 * `app/server/db.ts`. Replaces the base template's throwing stub.
 *
 * Research finding (2026-10-23, checked against the live npm registry and
 * verified end-to-end against a real Docker Postgres container, not just
 * read from docs): Better Auth ships its own first-party
 * `@better-auth/prisma-adapter` — published by the Better Auth
 * maintainers themselves, version-locked to `better-auth` core (both
 * 1.7.12 as of this writing), not a community package, the same "official
 * adapter" shape as `@better-auth/mongo-adapter`. Its `prismaAdapter(
 * prisma: PrismaClient, config: { provider: "sqlite" | "postgresql" |
 * ... })` signature mirrors Drizzle's adapter almost exactly: a
 * `provider` string telling it which SQL dialect it's talking to.
 *
 * `getSession`/`requireUser`/`signOut` are the fixed cross-provider
 * interface (PRD.md §9); they're `async` here (and in the base stub) for
 * the same reason `better-auth+drizzle`'s `auth.ts` documents: every real
 * provider needs to do I/O to answer "who is this?".
 *
 * `requireUser` throws a redirect `Response` (via React Router's own
 * `redirect()`, not a provider SDK) rather than a plain `Error` — the
 * router catches it and sends the browser to `/sign-in`.
 *
 * Dialect-agnostic by construction, same device as `better-auth+drizzle`'s
 * `dbProvider` export: each `app/server/db.ts` variant exports its own
 * `dbProvider` constant (`"postgresql"` for every Postgres host, `"sqlite"`
 * for `prisma+sqlite`) alongside `db` — so this file, and everything else
 * in it, is byte-identical no matter which database/host was selected.
 * Only `db.ts` (driver/adapter) differs by host; the users-table schema
 * (`prisma/schema/auth-schema.prisma`, shipped by this same glue fragment)
 * doesn't need a dialect split at all — Prisma's scalar types are
 * connector-agnostic, unlike Drizzle's `pg-core`/`sqlite-core` column
 * types.
 */
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { redirect } from "react-router";
import { db, dbProvider } from "./db.js";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: dbProvider }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export interface Session {
  userId: string;
}

export interface User {
  id: string;
  email: string;
}

export async function getSession(request: Request): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return null;
  }
  return { userId: session.user.id };
}

export async function requireUser(request: Request): Promise<User> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw redirect("/sign-in");
  }
  return { id: session.user.id, email: session.user.email };
}

export async function signOut(request: Request): Promise<Response> {
  const response = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });
  const headers = new Headers(response.headers);
  headers.set("Location", "/sign-in");
  return new Response(null, { status: 303, headers });
}

/** Used by the `/sign-in` demo route's `action` — not a public PRD interface. */
export async function signInWithPassword(email: string, password: string): Promise<Response> {
  return auth.api.signInEmail({ body: { email, password }, asResponse: true });
}

/** Used by the `/sign-in` demo route's `action` — not a public PRD interface. */
export async function signUpWithPassword(
  email: string,
  password: string,
  name: string,
): Promise<Response> {
  return auth.api.signUpEmail({ body: { email, password, name }, asResponse: true });
}
