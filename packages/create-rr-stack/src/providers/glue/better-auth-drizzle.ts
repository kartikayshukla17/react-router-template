import type { Glue } from "../../resolver/types.js";

/**
 * Wires Better Auth's Drizzle adapter into the real `app/server/auth.ts`
 * (replacing the throwing base stub) and ships the demo routes (landing,
 * sign-in, protected dashboard, notes CRUD) — the demo only makes sense
 * once both an ORM and an auth provider are present, so it travels with
 * this glue fragment rather than with either provider alone or a separate
 * "extras" mechanism.
 *
 * Deliberately dialect-agnostic (ticket 006): `app/server/auth.ts` reads
 * `provider: dbProvider` off whichever `app/server/db.ts` ends up selected
 * (`"pg"` for every Postgres host, `"sqlite"` for `drizzle+sqlite`) rather
 * than hard-coding a dialect, so this one glue fragment, and this one
 * `auth.ts`, is correct for both — the only thing that changes per dialect
 * is `db.ts` itself (driver) and the users-table schema, which is why this
 * fragment no longer ships `app/db/auth-schema.ts`: that file moved to its
 * own dialect-keyed sibling glue fragments, `better-auth-drizzle-postgres-
 * schema.ts` and `better-auth-drizzle-sqlite-schema.ts` below, selected
 * alongside this one by `resolver/resolve.ts`'s `selectGlue()` based on
 * `selections.database`. Splitting it this way means the auth-*wiring*
 * code (this file) is never duplicated per dialect — only the one file
 * whose column types genuinely differ is.
 */
export const betterAuthDrizzleGlue: Glue = {
  between: ["drizzle", "better-auth"],
  files: "glue/better-auth+drizzle",
  fileManifest: [
    "app/server/auth.ts",
    "app/routes.ts",
    "app/routes/home.tsx",
    "app/routes/sign-in.tsx",
    "app/routes/dashboard.tsx",
    "app/routes/notes.tsx",
  ],
};

/**
 * The Postgres-flavored half of the users-table schema split described
 * above: `app/db/auth-schema.ts` built from `drizzle-orm/pg-core` types
 * (`boolean`, `timestamp`). Keyed on `["better-auth", "postgres"]` —
 * `"postgres"` here is `selections.database`'s value, not a real provider
 * id in `providers/registry.ts` (there's no single "postgres" provider;
 * `postgres-neon`/`postgres-docker`/`postgres-supabase` are the real ones) —
 * a narrow, deliberate exception, same spirit as `Selections.postgresHost`
 * living outside the generic `Constraint` shape: the schema only cares
 * about the SQL dialect, not which host is serving it, so keying on the
 * dialect directly (rather than on all three host ids) avoids tripling this
 * fragment for no reason.
 */
export const betterAuthDrizzlePostgresSchemaGlue: Glue = {
  between: ["better-auth", "postgres"],
  files: "glue/better-auth+drizzle-postgres-schema",
  fileManifest: ["app/db/auth-schema.ts"],
};

/**
 * The SQLite-flavored half of the same split: `app/db/auth-schema.ts` built
 * from `drizzle-orm/sqlite-core` types (`integer(mode: "boolean")`,
 * `integer(mode: "timestamp")` in place of Postgres's `boolean`/
 * `timestamp`). Keyed on `["better-auth", "sqlite"]`, matching
 * `selections.database === "sqlite"` directly — see
 * `betterAuthDrizzlePostgresSchemaGlue` above for why the second id is a
 * dialect, not a provider id.
 */
export const betterAuthDrizzleSqliteSchemaGlue: Glue = {
  between: ["better-auth", "sqlite"],
  files: "glue/better-auth+drizzle-sqlite-schema",
  fileManifest: ["app/db/auth-schema.ts"],
};
