/**
 * Auth server interface — real implementation using Clerk's backend SDK
 * directly (`@clerk/backend`'s `authenticateRequest`), not React Router's
 * `clerkMiddleware()`/`rootAuthLoader` pair. That pair exists to thread
 * Clerk's auth state through `context` for SSR, but `getSession`/
 * `requireUser`/`signOut` are shared helpers called from several routes'
 * loaders/actions and only ever receive a bare `Request` (PRD.md §9's fixed
 * shape) — not the richer, route-typed loader `args` a context lookup
 * needs. `authenticateRequest` verifies the session directly from the
 * request's cookies/headers, so it works from a bare `Request` with no
 * middleware wiring required, at the cost of the SSR-only optimizations
 * (e.g. avoiding a flash of signed-out content) that pair provides.
 *
 * Unlike Better Auth, Clerk needs no ORM/database at all (ticket 009) — the
 * only provider SDK import for auth in the whole generated app lives here;
 * `app/root.tsx`'s `<ClerkProvider>` is the only other Clerk import, for
 * the client-side `<SignIn />` component.
 */
import { createClerkClient } from "@clerk/backend";
import { redirect } from "react-router";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
});

export interface Session {
  userId: string;
}

export interface User {
  id: string;
  email: string;
}

async function authenticate(request: Request) {
  return clerkClient.authenticateRequest(request, {
    authorizedParties: [new URL(request.url).origin],
  });
}

export async function getSession(request: Request): Promise<Session | null> {
  const state = await authenticate(request);
  if (!state.isAuthenticated) {
    return null;
  }
  return { userId: state.toAuth().userId };
}

export async function requireUser(request: Request): Promise<User> {
  const state = await authenticate(request);
  if (!state.isAuthenticated) {
    throw redirect("/sign-in");
  }
  const { userId } = state.toAuth();
  const user = await clerkClient.users.getUser(userId);
  return { id: user.id, email: user.primaryEmailAddress?.emailAddress ?? "" };
}

export async function signOut(request: Request): Promise<Response> {
  const state = await authenticate(request);
  if (state.isAuthenticated) {
    await clerkClient.sessions.revokeSession(state.toAuth().sessionId);
  }
  return redirect("/sign-in");
}
