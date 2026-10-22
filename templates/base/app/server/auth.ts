/**
 * Auth server interface — fixed shape across every auth provider fragment.
 *
 * No auth provider is selected in the base template, so every export below
 * throws at call time. A provider fragment (e.g. `providers/auth/clerk`)
 * replaces this file wholesale with a real implementation of the same shape.
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

export function getSession(_request: Request): Session | null {
  return notConfigured();
}

export function requireUser(_request: Request): User {
  return notConfigured();
}

export function signOut(_request: Request): Response {
  return notConfigured();
}
