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
import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

/**
 * Per-request, cookie-scoped client (ticket 010's `auth/supabase-auth`,
 * and any future layer that needs a signed-in user's own Postgres role
 * under RLS) — the factory this file's own doc comment above calls for.
 * Built fresh per request from `@supabase/ssr`'s standard
 * `createServerClient` + `parseCookieHeader`/`serializeCookieHeader` glue,
 * since `@supabase/ssr`'s cookie methods are framework-agnostic (no
 * built-in React Router adapter): `getAll()` reads the incoming `Cookie`
 * header, `setAll()` collects every cookie Supabase wants to set into
 * `headers` for the caller to copy onto whatever `Response` it returns
 * (same shape as `better-auth`'s `signOut`/`sign-in` action — see
 * `auth/supabase-auth`'s `app/server/auth.ts`).
 */
export function createSupabaseServerClient(request: Request): {
  supabase: SupabaseClient;
  headers: Headers;
} {
  const headers = new Headers();
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
        }
      },
    },
  });
  return { supabase: client, headers };
}
