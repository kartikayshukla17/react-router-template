import type { Glue } from "../../resolver/types.js";

/**
 * Wires Drizzle's `app/server/db.ts` against Neon's serverless HTTP driver
 * (`drizzle-orm/neon-http` + `@neondatabase/serverless`). This is the glue
 * fragment ticket 003 originally shipped as part of `orm/drizzle` itself,
 * moved here in ticket 004 once a second host (Docker) needed its own
 * driver wiring — `drizzle` now ships only the host-independent schema +
 * `drizzle-kit` config, and each host contributes the `db.ts` that matches
 * its driver via this kind of `drizzle+<host>` glue.
 */
export const drizzlePostgresNeonGlue: Glue = {
  between: ["drizzle", "postgres-neon"],
  files: "glue/drizzle+postgres-neon",
  // Also ships the Postgres-flavored starter schema and drizzle-kit config
  // (ticket 006) — see drizzle-postgres-docker.ts for why these moved here
  // from `orm/drizzle`.
  fileManifest: ["app/server/db.ts", "app/db/schema.ts", "drizzle.config.ts"],
};
