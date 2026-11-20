/**
 * Shared Firebase Admin SDK client + session-cookie helpers
 * (https://firebase.google.com/docs/auth/admin/manage-cookies). Firebase's
 * Admin SDK never accepts raw credentials — only the browser client SDK
 * (`app/lib/firebase-client.ts`, sibling file) can call
 * `signInWithEmailAndPassword`/`createUserWithEmailAndPassword` — so the
 * flow this module supports is: the browser signs in and gets a short-lived
 * ID token, POSTs it to a route `action`, and `createSessionResponse`
 * below exchanges it for a long-lived `__session` cookie the server can
 * verify on every later request via `verifySession`, with no further
 * client SDK involvement.
 *
 * `cert({ projectId, clientEmail, privateKey })` (rather than a service
 * account JSON file path or `GOOGLE_APPLICATION_CREDENTIALS`) is the
 * explicit-env-vars init path, matching how every other provider in this
 * project takes credentials. `FIREBASE_PRIVATE_KEY`'s `\n` escapes survive
 * round-tripping through a `.env` file as literal backslash-n, not a real
 * newline — `cert()` needs the real thing, hence the `replace` below.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.VITE_FIREBASE_PROJECT_ID ?? "";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? "";
const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

/**
 * Exported (not just used internally) so a sibling fragment that also
 * needs the Admin SDK — `storage/firebase-storage` (ticket 014) — builds
 * on the same initialized app instead of re-reading these env vars and
 * calling `initializeApp` a second time. `getApps()[0] ??` already guards
 * against Firebase's own "app already exists" throw either way; exporting
 * this just avoids the redundant re-init work and a second place these
 * four env vars get parsed.
 */
export const adminApp =
  getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const adminAuth = getAuth(adminApp);

export const SESSION_COOKIE_NAME = "__session";

/**
 * 5 days, in milliseconds — Firebase's own documented example value,
 * safely inside the allowed 5-minute-to-2-week range for
 * `createSessionCookie`'s `expiresIn`.
 */
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("Cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1];
}

/**
 * Verifies the incoming request's session cookie against Firebase, with
 * revocation checked on every call (one extra network round trip, traded
 * for a session that's actually dead the moment it's revoked — see
 * `revokeSession` below). Returns `null` for a missing or invalid cookie
 * rather than throwing: callers decide what "not signed in" means.
 */
export async function verifySession(request: Request) {
  const cookie = readSessionCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    return await adminAuth.verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}

/** Exchanges a client-obtained ID token for a session-cookie `Response`. */
export async function createSessionResponse(idToken: string, redirectTo: string): Promise<Response> {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
  const headers = new Headers({ Location: redirectTo });
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_MS / 1000}`,
  );
  return new Response(null, { status: 303, headers });
}

export function clearSessionResponse(redirectTo: string): Response {
  const headers = new Headers({ Location: redirectTo });
  headers.append("Set-Cookie", `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
  return new Response(null, { status: 303, headers });
}

/** Revokes every refresh token for `uid`, forcing all of their sessions to re-authenticate. */
export async function revokeSession(uid: string): Promise<void> {
  await adminAuth.revokeRefreshTokens(uid);
}
