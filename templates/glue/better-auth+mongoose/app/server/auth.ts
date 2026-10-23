/**
 * Auth server interface — real implementation wiring Better Auth's official
 * MongoDB adapter (`@better-auth/mongo-adapter`) to the same MongoDB
 * connection `app/server/db.ts` already opened via Mongoose.
 *
 * Research finding (2026-10-23, checked against the live npm registry, not
 * invented): Better Auth does not need a hand-rolled or community Mongoose
 * adapter here. It ships its own first-party `@better-auth/mongo-adapter`
 * — published by the Better Auth maintainers themselves, version-locked to
 * `better-auth` core (both at 1.7.12 as of this writing), not a community
 * package. Its `mongodbAdapter(db: Db, config?: { client?: MongoClient })`
 * signature takes the plain `mongodb`-driver `Db`/`MongoClient` types, not
 * anything Mongoose-specific — but Mongoose is itself built on top of that
 * same driver (it depends on `mongodb` directly), so
 * `mongoose.connection.db` *is* a real `mongodb.Db` and
 * `mongoose.connection.getClient()` *is* a real `mongodb.MongoClient`.
 * Passing those straight into the official adapter gives Better Auth real,
 * persistent user/session storage in the same database Mongoose already
 * uses, with no second connection and no hand-rolled adapter — the ticket's
 * "community adapter, or fall back to cookie-only sessions" contingency
 * wasn't needed.
 *
 * `transaction: false` is required, not optional, for the Docker host: the
 * adapter defaults to wrapping multi-step operations in a MongoDB
 * transaction whenever a `client` is supplied, but transactions only work
 * against a replica set (or `mongos`), and the local Docker Compose
 * container (`providers/database/mongodb-docker`) is a bare standalone
 * `mongod` — verified empirically, not just from the adapter's own docs:
 * signing up against it with transactions left at their default threw
 * `MongoServerError: Transaction numbers are only allowed on a replica set
 * member or mongos`. A hosted cluster (e.g. MongoDB Atlas) is normally a
 * replica set and could support transactions, but there's no reliable way
 * to tell from a bare connection string which kind of hosted deployment a
 * user has, so `transaction: false` is set unconditionally for both hosts
 * — correctness over an optimization neither host actually needs for this
 * demo's simple single-document operations anyway.
 *
 * `getSession`/`requireUser`/`signOut` are the fixed cross-provider
 * interface (PRD.md §9); they're `async` here (and in the base stub) for
 * the same reason `better-auth+drizzle`'s `auth.ts` documents: every real
 * provider needs to do I/O to answer "who is this?".
 */
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { redirect } from "react-router";
import { mongooseConnection } from "./db.js";

const mongoDb = mongooseConnection.db;
if (!mongoDb) {
  // Shouldn't happen: `app/server/db.ts` top-level-`await`s
  // `mongoose.connect(...)` before this module's imports finish resolving.
  // Guards the type (`Db | undefined`) and fails loudly instead of handing
  // Better Auth an undefined database if that invariant is ever broken.
  throw new Error("Mongoose connection has no database handle — check MONGODB_URI.");
}

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    client: mongooseConnection.getClient(),
    transaction: false,
  }),
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
