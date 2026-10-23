import { defineProvider } from "../define-provider.js";

/**
 * Drizzle ORM. Host-independent: ships a starter schema (`app/db/schema.ts`,
 * a `notes` table used by the demo) and `drizzle.config.ts` for
 * `drizzle-kit`. The real `app/server/db.ts` client (replacing the throwing
 * base stub) is NOT shipped here — it's driver-specific (Neon's HTTP driver
 * vs. a plain TCP `postgres` client for Docker), so it comes from whichever
 * `drizzle+<host>` glue fragment matches the selected `postgresHost`
 * (`drizzlePostgresNeonGlue` / `drizzlePostgresDockerGlue` in
 * `providers/glue/`), selected by `resolver/resolve.ts`'s `selectGlue()`.
 *
 * `requires: database in [postgres]` is the layer-level constraint; the
 * narrower "must be a host with a driver fragment" constraint lives in
 * `resolver/rules.ts` (`drizzle-requires-supported-host`) since
 * `Constraint` only models `{layer, oneOf}` pairs, not the `postgresHost`
 * sub-field.
 */
export const drizzleProvider = defineProvider({
  layer: "orm",
  id: "drizzle",
  label: "Drizzle",
  requires: [{ layer: "database", oneOf: ["postgres"] }],
  deps: {
    "drizzle-orm": "^0.45.4",
  },
  devDeps: {
    "drizzle-kit": "^0.31.11",
  },
  env: [],
  files: "providers/orm/drizzle",
  fileManifest: ["app/db/schema.ts", "drizzle.config.ts"],
  scripts: {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
  },
  nextSteps: ["Run `npm run db:push` to create the notes table against DATABASE_URL."],
});
