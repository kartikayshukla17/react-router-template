import { defineProvider } from "../define-provider.js";

/**
 * Supabase Realtime (ticket 015) — the last of the five PRD layers to get
 * an implementation, and the non-Convex realtime path (Convex's own
 * realtime landed bundled with its database/auth, ticket 012).
 * `requires: []`: realtime is independent of database/auth exactly like
 * `storage/s3-presigned`/`storage/supabase-storage` — Supabase Realtime
 * works with a Neon database and Clerk auth (ticket 015's own example),
 * since it's built on Broadcast (a generic channel, no database tie-in),
 * not Postgres Changes (which only works against Supabase's own Postgres).
 *
 * `baas: "supabase"` reuses the shared `supabase-client` fragment — the
 * fourth proof (after `database/postgres-supabase`/005, `auth/supabase-
 * auth`/010, `storage/supabase-storage`/014) that it installs once no
 * matter how many layers need it.
 *
 * `app/lib/notes-realtime.ts` replaces the base template's no-op stub so
 * `/notes` (if an auth provider was also selected — this provider doesn't
 * require one) gets a live update in another tab within a few seconds of
 * a note being created/deleted, the smallest possible demonstration the
 * ticket asks for. With realtime left as "none", every `/notes` route's
 * unconditional `useNotesRealtime()`/`notifyNotesChanged()` calls still
 * compile and run — against the stub, so behavior is unchanged from
 * ticket 003, not just "no extra code generated" at the route level.
 */
export const supabaseRealtimeProvider = defineProvider({
  layer: "realtime",
  id: "supabase-realtime",
  label: "Supabase Realtime",
  baas: "supabase",
  requires: [],
  // Convex is all-or-nothing across database/auth/realtime
  // (`resolver/rules.ts`'s `convex-is-all-or-nothing`); this `conflicts`
  // entry just gives the CLI prompt's `disabled`/`reason` the same
  // signal, the way ORM options are already disabled once database is
  // convex via their own `requires` on a different database value.
  conflicts: [{ layer: "database", oneOf: ["convex"] }],
  deps: {},
  devDeps: {},
  env: [],
  files: "providers/realtime/supabase-realtime",
  fileManifest: ["app/server/realtime.ts", "app/lib/notes-realtime.ts"],
  nextSteps: [
    "Realtime is on by default for new Supabase projects — nothing to configure unless you've disabled it (dashboard → Project Settings → Realtime).",
  ],
});
