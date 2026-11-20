/**
 * Auth server interface — real implementation calling the hand-rolled
 * password functions in `convex/auth.ts` (sibling concern, project root;
 * see that file's doc comment for why this doesn't depend on
 * `@convex-dev/auth`). All password hashing happens here, in Node — scrypt
 * via `node:crypto`, never inside a Convex function (that runtime doesn't
 * have it) — so `convex/auth.ts` only ever sees an already-hashed string.
 *
 * The session token minted by `createSession` is this provider's own
 * concern, not Convex's: it's just an opaque random string stored in the
 * `sessions` table and handed to the browser as a plain cookie, verified
 * on every request via `getSessionUser`.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "react-router";
import { api } from "../../convex/_generated/api";

const SESSION_COOKIE_NAME = "convexSessionToken";
const convexUrl = process.env.VITE_CONVEX_URL ?? "";

function client(): ConvexHttpClient {
  return new ConvexHttpClient(convexUrl);
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function readSessionToken(request: Request): string | undefined {
  const header = request.headers.get("Cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1];
}

export interface Session {
  userId: string;
}

export interface User {
  id: string;
  email: string;
}

export async function getSession(request: Request): Promise<Session | null> {
  const token = readSessionToken(request);
  if (!token) {
    return null;
  }
  const user = await client().query(api.auth.getSessionUser, { token });
  return user ? { userId: user.id } : null;
}

export async function requireUser(request: Request): Promise<User> {
  const token = readSessionToken(request);
  const user = token ? await client().query(api.auth.getSessionUser, { token }) : null;
  if (!user) {
    throw redirect("/sign-in");
  }
  return { id: user.id, email: user.email };
}

export async function signOut(request: Request): Promise<Response> {
  const token = readSessionToken(request);
  if (token) {
    await client().mutation(api.auth.deleteSession, { token });
  }
  const headers = new Headers({ Location: "/sign-in" });
  headers.append("Set-Cookie", `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
  return new Response(null, { status: 303, headers });
}

/** Used by the `/sign-in` demo route's `action` — not a public PRD interface. */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error?: string; token?: string }> {
  try {
    const userId = await client().mutation(api.auth.createUser, {
      email,
      passwordHash: hashPassword(password),
    });
    const token = await client().mutation(api.auth.createSession, { userId });
    return { token };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create account." };
  }
}

/** Used by the `/sign-in` demo route's `action` — not a public PRD interface. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error?: string; token?: string }> {
  const user = await client().query(api.auth.getUserByEmail, { email });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }
  const token = await client().mutation(api.auth.createSession, { userId: user._id });
  return { token };
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
