/**
 * Shared Supabase client — anon-only. This is the one place
 * `@supabase/supabase-js` is installed and this specific *anon* client is
 * built from `SUPABASE_URL`/`SUPABASE_ANON_KEY`.
 *
 * What's actually shared/installed-once across layers (database, auth,
 * storage, realtime) is the `@supabase/supabase-js` npm dependency and the
 * existence of this module — NOT this `supabase` instance for anything
 * user-scoped or auth-related. A plain server-side
 * `createClient(url, anonKey)` carries no per-request user JWT: every
 * query through `supabase` below runs as Postgres's `anon` role under Row
 * Level Security, never as an authenticated user. `persistSession` is
 * explicitly disabled so this module-level singleton can never accumulate
 * a session across requests (that would leak one user's session to every
 * other request handled by the same server process).
 *
 * A future user-scoped layer (e.g. Supabase Auth) must NOT call
 * `supabase.auth.signIn*()`/`signOut()` on this singleton. Instead, add a
 * separate per-request client factory — here or in a sibling file — built
 * from the incoming request's cookies, e.g. `@supabase/ssr`'s
 * `createServerClient(url, anonKey, { cookies })` pattern, so each
 * request gets its own client carrying only that request's session.
 *
 * If a layer needs an elevated service-role client (e.g. server-side
 * admin tasks bypassing RLS), add that as its own export built from a
 * service-role key — never by mutating or reusing `supabase` below.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

/** Anon-only client. Runs under RLS as the `anon` role — never as a user. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
