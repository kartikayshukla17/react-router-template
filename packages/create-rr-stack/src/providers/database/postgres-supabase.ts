import { defineProvider } from "../define-provider.js";

/**
 * Postgres hosted on Supabase (https://supabase.com), used over its direct
 * connection string — a normal Postgres wire-protocol connection, not
 * Supabase's PostgREST/HTTP API. Ships no files of its own, same as
 * `postgres-neon`/`postgres-docker`: the real connection code lives in the
 * `drizzle+postgres-supabase` glue fragment's `app/server/db.ts`
 * (`providers/glue/drizzle-postgres-supabase.ts`), which uses the same
 * plain TCP `postgres`-package driver as the Docker host.
 *
 * `baas: "supabase"` is what makes this provider the first real trigger of
 * the shared-BaaS-client dedup mechanism (`resolver/resolve.ts`'s
 * `selectBaasClients()`): picking Supabase as the Postgres host also pulls
 * in the shared `supabase-client` fragment (`@supabase/supabase-js` +
 * `app/server/supabase-client.ts`) exactly once, the same fragment later
 * tickets' Supabase Auth/Storage/Realtime providers (010/014/015) will
 * declare `baas: "supabase"` and reuse rather than reinstall.
 */
export const postgresSupabaseProvider = defineProvider({
  layer: "database",
  id: "postgres-supabase",
  label: "PostgreSQL (Supabase)",
  baas: "supabase",
  deps: {},
  devDeps: {},
  env: [
    {
      name: "DATABASE_URL",
      description: "Direct Postgres connection string for your Supabase project",
      whereToFind:
        "Supabase dashboard (https://supabase.com/dashboard) → your project → Project Settings → Database → Connection string (URI, direct connection)",
      secret: true,
    },
  ],
  files: "providers/database/postgres-supabase",
  fileManifest: [],
  nextSteps: [
    "Create a Supabase project at https://supabase.com/dashboard if you don't have one yet.",
    "Copy the direct connection string (Project Settings → Database → Connection string) into DATABASE_URL in your .env file.",
  ],
});
