import { defineProvider } from "../define-provider.js";

/**
 * Supabase Auth (https://supabase.com/docs/guides/auth) — the second
 * no-ORM-required auth provider (ticket 010, after Clerk in ticket 009),
 * and the literal "mix providers across layers" example from the PRD's
 * grilling session: Supabase Auth pairs with any database/ORM choice (or
 * none), including a *different* database host (e.g. Neon Postgres), not
 * just Supabase's own.
 *
 * `baas: "supabase"` reuses the shared `supabase-client` fragment
 * (`providers/baas/supabase-client.ts`) via `resolve()`'s
 * `selectBaasClients()` dedup — installed once whether it's pulled in by
 * `database/postgres-supabase`, this provider, or both at once. This
 * provider needs no `deps` of its own: `@supabase/ssr` (the SSR
 * cookie-handling helper) is pinned on the shared `supabase-client`
 * fragment itself, since `createSupabaseServerClient` — this provider's
 * `app/server/auth.ts` calls it — lives there; see that fragment's doc
 * comment for why a plain anon singleton can't be reused for sign-in/out.
 */
export const supabaseAuthProvider = defineProvider({
  layer: "auth",
  id: "supabase-auth",
  label: "Supabase Auth",
  baas: "supabase",
  requires: [],
  deps: {},
  devDeps: {},
  env: [],
  files: "providers/auth/supabase-auth",
  fileManifest: [
    "app/routes.ts",
    "app/routes/home.tsx",
    "app/routes/sign-in.tsx",
    "app/routes/dashboard.tsx",
    "app/routes/notes.tsx",
    "app/server/auth.ts",
  ],
  nextSteps: [
    "Enable email/password sign-in in the Supabase dashboard → Authentication → Providers (it's on by default for new projects).",
  ],
});
