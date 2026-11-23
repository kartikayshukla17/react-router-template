import type { Glue } from "../../resolver/types.js";

/**
 * Wires Drizzle's `app/server/db.ts` against Supabase's direct Postgres
 * connection string (`drizzle-orm/postgres-js` + the `postgres` package) —
 * a normal Postgres wire-protocol connection, same driver family as
 * `drizzlePostgresDockerGlue`. Unlike Neon, Supabase's direct connection
 * isn't an HTTP/serverless protocol, so it reuses the plain TCP driver
 * rather than needing its own, e.g. `drizzle-orm/neon-http`-style wiring.
 */
export const drizzlePostgresSupabaseGlue: Glue = {
  between: ["drizzle", "postgres-supabase"],
  files: "glue/drizzle+postgres-supabase",
  deps: {
    postgres: "^4.1.1",
  },
  // Also ships the Postgres-flavored starter schema and drizzle-kit config
  // (ticket 006) — see drizzle-postgres-docker.ts for why these moved here
  // from `orm/drizzle`.
  fileManifest: ["app/server/db.ts", "app/db/schema.ts", "drizzle.config.ts"],
};
