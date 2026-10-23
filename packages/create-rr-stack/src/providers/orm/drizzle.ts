import { defineProvider } from "../define-provider.js";

/**
 * Drizzle ORM, wired against Neon's serverless Postgres driver. Ships the
 * real `app/server/db.ts` client (replacing the throwing stub), a starter
 * schema (`app/db/schema.ts`, a `notes` table used by the demo), and
 * `drizzle.config.ts` for `drizzle-kit`.
 *
 * `requires: database in [postgres]` is the layer-level constraint; the
 * narrower "must specifically be the Neon host" constraint lives in
 * `resolver/rules.ts` (`drizzle-requires-neon-host`) since `Constraint` only
 * models `{layer, oneOf}` pairs, not the `postgresHost` sub-field.
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
  fileManifest: ["app/server/db.ts", "app/db/schema.ts", "drizzle.config.ts"],
  scripts: {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
  },
  nextSteps: ["Run `npm run db:push` to create the notes table against DATABASE_URL."],
});
