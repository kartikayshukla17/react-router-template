import type { Glue } from "../../resolver/types.js";

/**
 * Wires Better Auth's official Prisma adapter into the real
 * `app/server/auth.ts` (replacing the throwing base stub) and ships the
 * same demo routes (landing, sign-in, protected dashboard, notes CRUD) as
 * `better-auth+drizzle`/`better-auth+mongoose` — the demo only makes sense
 * once both an ORM and an auth provider are present, same reasoning as
 * those fragments.
 *
 * Research finding (2026-10-23, live npm registry + a packed tarball
 * inspection, not invented): Better Auth ships its own first-party
 * `@better-auth/prisma-adapter` (version-locked to `better-auth` core,
 * both 1.7.12 as of this writing — same "official, not community" shape
 * as `@better-auth/mongo-adapter`). Its `prismaAdapter(prisma: PrismaClient,
 * config: { provider: "sqlite" | "postgresql" | ... })` signature mirrors
 * Drizzle's adapter almost exactly: a `provider` string telling the
 * adapter which SQL dialect it's talking to. Verified end-to-end against a
 * real Docker Postgres container: `prismaAdapter(db, { provider:
 * "postgresql" })` + `emailAndPassword: { enabled: true }` successfully
 * signed up a user and read back a session through `auth.api.getSession`.
 *
 * Dialect-agnostic by construction, same device as `better-auth+drizzle`'s
 * `dbProvider` export: `app/server/db.ts` exports a `dbProvider` constant
 * (`"postgresql"` for every Postgres host, `"sqlite"` for `prisma+sqlite`)
 * that this file reads rather than hard-coding — so this one glue
 * fragment, and this one `auth.ts`, is correct for every host. Unlike
 * `better-auth+drizzle`, no dialect-keyed *schema* sibling fragment is
 * needed either: Prisma's scalar types (`String`, `Boolean`, `DateTime`)
 * are connector-agnostic, so `prisma/schema/auth-schema.prisma` (the
 * users/session/account/verification models) is the same file for every
 * database/host combination — one fragment covers both the wiring and the
 * schema, where Drizzle needed three (the wiring fragment plus two
 * dialect-keyed schema fragments).
 */
export const betterAuthPrismaGlue: Glue = {
  between: ["prisma", "better-auth"],
  files: "glue/better-auth+prisma",
  deps: {
    "@better-auth/prisma-adapter": "^1.7.12",
  },
  fileManifest: [
    "app/server/auth.ts",
    "app/routes.ts",
    "app/routes/home.tsx",
    "app/routes/sign-in.tsx",
    "app/routes/dashboard.tsx",
    "app/routes/notes.tsx",
    "prisma/schema/auth-schema.prisma",
  ],
};
