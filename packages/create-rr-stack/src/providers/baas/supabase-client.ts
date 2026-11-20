import { defineProvider } from "../define-provider.js";

/**
 * The shared Supabase client fragment: installs `@supabase/supabase-js`
 * once and ships `app/server/supabase-client.ts`, regardless of how many
 * selected providers independently need it. This is the canonical fragment
 * `resolver/resolve.ts`'s `selectBaasClients()` includes in a `Plan` at
 * most once, no matter how many selected providers declare
 * `baas: "supabase"` (today: `database/postgres-supabase`; later: ticket
 * 010's Supabase Auth, 014's Supabase Storage, 015's Supabase Realtime).
 *
 * Lives on its own `"baas"` layer (see `resolver/types.ts`) rather than
 * `"database"`/`"auth"`/etc. — it isn't selected through any per-layer
 * prompt, it's computed from which *other* providers need it, so giving it
 * a layer of its own (instead of borrowing one it doesn't semantically
 * belong to) keeps `Plan.providers` honest about what each entry is.
 *
 * Deliberately NOT added to `providers/registry.ts`'s `allProviders`
 * (the list `selectProviders()` looks providers up in by `(layer, id)`
 * from real `Selections` fields) — nothing in `Selections` ever names this
 * provider directly. It's found only through
 * `providers/baas-registry.ts`'s `findBaasClientProvider()`, called from
 * `selectBaasClients()`.
 */
export const supabaseClientProvider = defineProvider({
  layer: "baas",
  id: "supabase-client",
  label: "Supabase client",
  deps: {
    "@supabase/supabase-js": "^2.58.0",
    // Pulled in unconditionally (not just when auth/supabase-auth is
    // selected): `createSupabaseServerClient` (ticket 010) lives in this
    // fragment's own `supabase-client.ts`, so every consumer of the shared
    // client needs this import to resolve, even a database-only one.
    "@supabase/ssr": "^0.12.7",
  },
  devDeps: {},
  env: [
    {
      name: "SUPABASE_URL",
      description: "Your Supabase project's API URL",
      whereToFind:
        "Supabase dashboard (https://supabase.com/dashboard) → your project → Project Settings → API → Project URL",
      secret: false,
    },
    {
      name: "SUPABASE_ANON_KEY",
      description: "Your Supabase project's anon (public) API key",
      whereToFind:
        "Supabase dashboard (https://supabase.com/dashboard) → your project → Project Settings → API → Project API keys → anon public",
      secret: true,
    },
  ],
  files: "providers/baas/supabase-client",
  fileManifest: ["app/server/supabase-client.ts"],
  nextSteps: [
    "Copy your Supabase project's URL and anon public key into SUPABASE_URL / SUPABASE_ANON_KEY in your .env file (Project Settings → API).",
  ],
});
