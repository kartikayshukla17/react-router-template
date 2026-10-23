import type { Glue } from "../../resolver/types.js";

/**
 * Wires Drizzle's `app/server/db.ts` against a plain TCP Postgres
 * connection (`drizzle-orm/postgres-js` + the `postgres` package) for the
 * self-hosted Docker Compose database. Neon's HTTP/serverless driver
 * (`@neondatabase/serverless`) speaks a different wire protocol and does
 * not work against a normal Postgres server, so Docker gets its own
 * `drizzle+<host>` glue fragment instead of reusing Neon's — same shape as
 * `drizzlePostgresNeonGlue`, different driver.
 */
export const drizzlePostgresDockerGlue: Glue = {
  between: ["drizzle", "postgres-docker"],
  files: "glue/drizzle+postgres-docker",
  deps: {
    postgres: "^3.4.9",
  },
  fileManifest: ["app/server/db.ts"],
};
