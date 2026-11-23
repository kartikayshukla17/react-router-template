import type { Glue } from "../../resolver/types.js";

/**
 * Wires Drizzle's `app/server/db.ts` against a local SQLite file via
 * `better-sqlite3` + `drizzle-orm/better-sqlite3` (see the generated file's
 * own doc comment for why `better-sqlite3` over libSQL). SQLite has no
 * `postgresHost`-style "which host" concept, so unlike the three
 * `drizzle+postgres-<host>` fragments, there's exactly one `drizzle+sqlite`
 * fragment — selected whenever `selections.database === "sqlite"`
 * regardless of any host field (there is none).
 *
 * Also ships the SQLite-flavored starter schema (`app/db/schema.ts`) and
 * `drizzle.config.ts` (`dialect: "sqlite"`) alongside `db.ts`, in one
 * fragment — Postgres splits these across host-specific fragments only
 * because the driver differs per host; SQLite has one driver and one
 * schema flavor, so one fragment carries all three files.
 */
export const drizzleSqliteGlue: Glue = {
  between: ["drizzle", "sqlite"],
  files: "glue/drizzle+sqlite",
  deps: {
    "better-sqlite3": "^13.2.0",
  },
  devDeps: {
    "@types/better-sqlite3": "^9.6.0",
  },
  fileManifest: ["app/server/db.ts", "app/db/schema.ts", "drizzle.config.ts"],
};
