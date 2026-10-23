/**
 * Auth server interface — fixed shape across every auth provider fragment.
 *
 * No auth provider is selected in the base template, so every export below
 * throws at call time. A provider fragment (e.g. `providers/auth/clerk`, or
 * the `better-auth+drizzle` glue fragment) replaces this file wholesale with
 * a real implementation of the same shape.
 *
 * `async`/`Promise`-returning rather than the PRD's literal synchronous
 * signatures: every real provider needs to do I/O (verify a cookie, look up
 * a session row, call a BaaS) to answer "who is this?", so the fixed
 * interface has to be async to be implementable by any real provider, not
 * just this one. Documented deviation, ticket 003.
 */

export interface Session {
  userId: string;
}

export interface User {
  id: string;
}

function notConfigured(): never {
  throw new Error(
    "No auth provider configured. Select an auth provider when scaffolding " +
      "this app to replace app/server/auth.ts with a working implementation.",
  );
}

export async function getSession(_request: Request): Promise<Session | null> {
  return notConfigured();
}

export async function requireUser(_request: Request): Promise<User> {
  return notConfigured();
}

export async function signOut(_request: Request): Promise<Response> {
  return notConfigured();
}
