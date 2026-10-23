import { defineProvider } from "../define-provider.js";

/**
 * Drizzle ORM. Dialect- and host-independent: only declares the shared
 * `drizzle-orm`/`drizzle-kit` deps and `db:push`/`db:studio` scripts.
 *
 * Ships no files of its own. Both the starter schema (`app/db/schema.ts`,
 * the `notes` table used by the demo) and `drizzle.config.ts` are
 * dialect-specific (Postgres's `pg-core` types + `dialect: "postgresql"`
 * vs. SQLite's `sqlite-core` types + `dialect: "sqlite"`) and, for Postgres,
 * also need a driver-specific `app/server/db.ts` (Neon's HTTP driver vs. a
 * plain TCP `postgres` client for Docker/Supabase) — so all three files
 * come from whichever `drizzle+<host>` / `drizzle+sqlite` glue fragment
 * matches the selection (`providers/glue/`), selected by
 * `resolver/resolve.ts`'s `selectGlue()`. Keeping `orm/drizzle` itself
 * fileless means there's nothing here for a path collision to even be
 * possible against.
 *
 * `requires: database in [postgres, sqlite]` is the layer-level constraint;
 * the narrower "postgres must be a host with a driver fragment" constraint
 * lives in `resolver/rules.ts` (`drizzle-requires-supported-host`) since
 * `Constraint` only models `{layer, oneOf}` pairs, not the `postgresHost`
 * sub-field. SQLite has no such sub-field — it's available unconditionally
 * once `database` is `"sqlite"`.
 */
export const drizzleProvider = defineProvider({
  layer: "orm",
  id: "drizzle",
  label: "Drizzle",
  requires: [{ layer: "database", oneOf: ["postgres", "sqlite"] }],
  deps: {
    "drizzle-orm": "^0.45.4",
  },
  devDeps: {
    "drizzle-kit": "^0.31.11",
  },
  env: [],
  files: "providers/orm/drizzle",
  fileManifest: [],
  scripts: {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
  },
  nextSteps: ["Run `npm run db:push` to create the notes table against the selected database."],
});
