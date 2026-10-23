import type { Glue } from "../../resolver/types.js";

/**
 * Wires Mongoose's `app/server/db.ts` (connection + `Note`-model CRUD
 * helpers) and `app/db/schema.ts` (the `Note` model itself) against
 * whichever MongoDB host was selected.
 *
 * Keyed on `["mongoose", "mongodb"]` — the second id is `selections.
 * database`'s *value* ("mongodb"), not a real provider id in
 * `providers/registry.ts` (there's no single "mongodb" provider;
 * `mongodb-docker`/`mongodb-hosted` are the real ones). Same deliberate
 * exception `providers/glue/better-auth-drizzle.ts` documents for its own
 * dialect-keyed schema fragments: Mongoose's connection code only cares
 * about the fact that it's talking to *some* MongoDB via a connection
 * string, not which host produced that string, so one fragment serves both
 * hosts instead of this file tripling the way the three
 * `drizzle+postgres-<host>` fragments do (those differ because the actual
 * *driver* differs per Postgres host; Mongo has one driver story for both).
 */
export const mongooseMongodbGlue: Glue = {
  between: ["mongoose", "mongodb"],
  files: "glue/mongoose+mongodb",
  fileManifest: ["app/server/db.ts", "app/db/schema.ts"],
};
