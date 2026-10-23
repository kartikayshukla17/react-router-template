import type { Glue } from "../../resolver/types.js";

/**
 * Wires Better Auth into `app/server/auth.ts` against Mongoose's MongoDB
 * connection, and ships the same demo routes (landing, sign-in, protected
 * dashboard, notes CRUD) as `better-auth+drizzle` — the demo only makes
 * sense once both an ORM and an auth provider are present, same reasoning
 * as that fragment.
 *
 * Research finding (2026-10-23, live npm registry): Better Auth does *not*
 * need a hand-rolled or community Mongoose adapter here. It ships its own
 * first-party `@better-auth/mongo-adapter` (published by the same
 * maintainers, version-locked to `better-auth` itself — not a community
 * package, a *stronger* result than this ticket's "community adapter, or
 * fall back to cookie-only sessions" framing anticipated). That adapter's
 * `mongodbAdapter(db: Db, config?: { client?: MongoClient })` takes the
 * plain `mongodb`-driver `Db`/`MongoClient` types, not anything
 * Mongoose-specific — but Mongoose is itself built on top of that same
 * driver, so `mongoose.connection.db`/`mongoose.connection.getClient()`
 * (exposed from `app/server/db.ts` as `mongooseConnection`) satisfy the
 * adapter directly, with real persistent user/session storage, no fallback
 * needed. See `app/server/auth.ts`'s own doc comment for the exact wiring.
 *
 * Unlike `better-auth+drizzle`, no dialect-keyed schema sibling fragment is
 * needed: MongoDB is schemaless, so there's no SQL-style users-table DDL to
 * split by dialect the way `better-auth-drizzle-{postgres,sqlite}-schema`
 * must.
 */
export const betterAuthMongooseGlue: Glue = {
  between: ["better-auth", "mongoose"],
  files: "glue/better-auth+mongoose",
  deps: {
    "@better-auth/mongo-adapter": "^1.7.12",
  },
  fileManifest: [
    "app/server/auth.ts",
    "app/routes.ts",
    "app/routes/home.tsx",
    "app/routes/sign-in.tsx",
    "app/routes/dashboard.tsx",
    "app/routes/notes.tsx",
  ],
};
