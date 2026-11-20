/**
 * Auth server interface — real implementation over Firebase Admin SDK
 * session-cookie verification, via the shared helpers in
 * `app/server/firebase-admin.ts` (the `firebase-client` BaaS fragment
 * ticket 011 shares with Firebase Storage, ticket 014). The actual
 * sign-in/sign-up call happens in the browser (`app/routes/sign-in.tsx`,
 * against `app/lib/firebase-client.ts`'s client SDK) — see that module's
 * doc comment for why the Admin SDK can't do it itself.
 */
import { redirect } from "react-router";
import { clearSessionResponse, revokeSession, verifySession } from "~/server/firebase-admin";

export interface Session {
  userId: string;
}

export interface User {
  id: string;
  email: string;
}

export async function getSession(request: Request): Promise<Session | null> {
  const claims = await verifySession(request);
  if (!claims) {
    return null;
  }
  return { userId: claims.uid };
}

export async function requireUser(request: Request): Promise<User> {
  const claims = await verifySession(request);
  if (!claims) {
    throw redirect("/sign-in");
  }
  return { id: claims.uid, email: claims.email ?? "" };
}

export async function signOut(request: Request): Promise<Response> {
  const claims = await verifySession(request);
  if (claims) {
    await revokeSession(claims.uid);
  }
  return clearSessionResponse("/sign-in");
}
