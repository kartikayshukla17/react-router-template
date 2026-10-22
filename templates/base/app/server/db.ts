/**
 * Database server interface — fixed seam across every database/ORM provider
 * fragment. The real shape of `db` (Drizzle client, Prisma client, Mongoose
 * models, Convex client, ...) is provider-specific and decided later; this
 * stub only guarantees the seam exists at `app/server/db.ts`.
 *
 * No database provider is selected in the base template, so touching any
 * property on `db` throws at call time. A provider fragment (e.g.
 * `providers/database/postgres-docker` + an ORM fragment) replaces this file
 * wholesale with a real client of the same name.
 */

function notConfigured(): never {
  throw new Error(
    "No database provider configured. Select a database provider when scaffolding " +
      "this app to replace app/server/db.ts with a working client.",
  );
}

export type DbClient = Record<string, never>;

export const db: DbClient = new Proxy({} as DbClient, {
  get() {
    return notConfigured();
  },
  apply() {
    return notConfigured();
  },
});
