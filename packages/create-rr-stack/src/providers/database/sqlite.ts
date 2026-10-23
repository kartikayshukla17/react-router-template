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
 *
 * Deliberately no "nothing to configure" `nextSteps` entry here: whether
 * the *overall* plan has nothing to configure is a property of the whole
 * resolved `Plan.env` (every selected provider across every layer), not
 * of this provider alone — e.g. SQLite + Drizzle + Better Auth still
 * needs `BETTER_AUTH_SECRET`. That generic message is rendered by
 * `cli/next-steps.ts` when `plan.env.length === 0`, not hardcoded here.
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
  nextSteps: [],
});
