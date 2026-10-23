/**
 * Auth server interface — real implementation wiring Better Auth's Drizzle
 * adapter to `app/server/db.ts`. Replaces the base template's throwing
 * stub.
 *
 * `getSession`/`requireUser`/`signOut` are the fixed cross-provider
 * interface (PRD.md §9); they're `async` here (and in the base stub) because
 * every real provider needs to do I/O to answer "who is this?" — a
 * deliberate, documented deviation from the PRD's literal synchronous
 * signatures, needed for any provider to actually work, not just this one.
 *
 * `requireUser` throws a redirect `Response` (via React Router's own
 * `redirect()`, not a provider SDK) rather than a plain `Error` — the
 * router catches it and sends the browser to `/sign-in`.
 *
 * Dialect-agnostic by construction: Better Auth's Drizzle adapter takes the
 * drizzle client + schema regardless of SQL dialect, but it does need to be
 * told which dialect it's talking to (`provider: "pg" | "mysql" |
 * "sqlite"`). Rather than hard-coding that here (which would make this file
 * differ between a Postgres-backed and a SQLite-backed project), each
 * `app/server/db.ts` variant exports its own `dbProvider` constant alongside
 * `db` — so this file, and everything else in it, is byte-identical no
 * matter which database/host was selected. Only `db.ts` (driver) and the
 * users-table schema file (`app/db/auth-schema.ts`, shipped by
 * `better-auth+drizzle-postgres-schema` or `better-auth+drizzle-sqlite-
 * schema`) differ by dialect.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { redirect } from "react-router";
import * as authSchema from "../db/auth-schema.js";
import { db, dbProvider } from "./db.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: dbProvider, schema: authSchema }),
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
