/**
 * Auth server interface — real implementation over `supabase-js` auth
 * methods, via the shared `createSupabaseServerClient` factory
 * (`app/server/supabase-client.ts`, from the `supabase-client` BaaS
 * fragment ticket 005 shares across layers). Every call below builds a
 * fresh, per-request client — never the module-level anon singleton that
 * file also exports — so one request's session can never leak into
 * another's.
 *
 * `supabase.auth.getUser()` (not `getSession()`) backs both `getSession`
 * and `requireUser`: it re-verifies the token against Supabase's Auth
 * server on every call, so a session revoked server-side (or simply
 * expired) is caught immediately, matching Supabase's own guidance that
 * `getSession()`'s cached result "isn't re-validated against the Auth
 * server" and shouldn't be trusted in server code.
 */
import { redirect } from "react-router";
import { createSupabaseServerClient } from "~/server/supabase-client";

export interface Session {
  userId: string;
}

export interface User {
  id: string;
  email: string;
}

export async function getSession(request: Request): Promise<Session | null> {
  const { supabase } = createSupabaseServerClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return { userId: data.user.id };
}

export async function requireUser(request: Request): Promise<User> {
  const { supabase } = createSupabaseServerClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect("/sign-in");
  }
  return { id: data.user.id, email: data.user.email ?? "" };
}

export async function signOut(request: Request): Promise<Response> {
  const { supabase, headers } = createSupabaseServerClient(request);
  await supabase.auth.signOut();
  headers.set("Location", "/sign-in");
  return new Response(null, { status: 303, headers });
}

/** Used by the `/sign-in` demo route's `action` — not a public PRD interface. */
export async function signInWithPassword(
  request: Request,
  email: string,
  password: string,
): Promise<{ error?: string; headers: Headers }> {
  const { supabase, headers } = createSupabaseServerClient(request);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message, headers };
}

/** Used by the `/sign-in` demo route's `action` — not a public PRD interface. */
export async function signUpWithPassword(
  request: Request,
  email: string,
  password: string,
): Promise<{ error?: string; headers: Headers }> {
  const { supabase, headers } = createSupabaseServerClient(request);
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message, headers };
}
