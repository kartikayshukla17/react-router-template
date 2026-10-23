import { defineProvider } from "../define-provider.js";

/**
 * SQLite as a local file database — the zero-account, zero-Docker option.
 * Unlike `"postgres"`, `"sqlite"` has no `postgresHost`-style "which
 * provider actually runs it" concept: there's exactly one way to run it
 * (a file on disk), so there's exactly one provider for the whole layer,
 * selected the instant `selections.database === "sqlite"` — no second
 * prompt, no `Constraint` sub-field to resolve, unlike Postgres's
 * `postgres-requires-supported-host` rule.
 *
 * Ships no files of its own (`fileManifest: []`): the real
 * `app/server/db.ts` driver and the `notes`/`auth-schema` tables are
 * dialect-specific and come from the `drizzle+sqlite` / `better-auth+
 * drizzle-sqlite-schema` glue fragments instead, same reasoning as why
 * `database/postgres-neon` and `database/postgres-docker` don't ship
 * `app/server/db.ts` themselves. No env vars either — the file path is a
 * fixed local default, nothing to fill in before `npm run dev` works.
 */
export const sqliteProvider = defineProvider({
  layer: "database",
  id: "sqlite",
  label: "SQLite (local file)",
  deps: {},
  devDeps: {},
  env: [],
  files: "providers/database/sqlite",
  fileManifest: [],
  nextSteps: ["Nothing to configure — SQLite runs from a local file. Just run `npm run dev`."],
});
