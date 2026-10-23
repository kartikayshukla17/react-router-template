/**
 * Prisma CLI config. Once a `prisma.config.ts` is present, Prisma stops
 * auto-loading `.env` for CLI commands (`db:push`, `db:studio`) — verified
 * empirically (2026-10-23) against a real `npx prisma db push` run, which
 * prints "Prisma config detected, skipping environment variable loading."
 * `import "dotenv/config"` restores that env-loading ergonomics so
 * `DATABASE_URL` from `.env` reaches the CLI the same way it already does
 * for the running app (Vite loads `.env` for the dev server on its own;
 * this file is CLI-only).
 *
 * `schema: "prisma/schema"` points at the schema *folder* (not a single
 * `schema.prisma` file) — no `prismaSchemaFolder` preview flag needed,
 * confirmed against Prisma 6.19.3 directly. This lets the Note model
 * (shipped by this `prisma+postgres-docker` glue fragment) and the Better
 * Auth users-table models (shipped by the separate `better-auth+prisma`
 * glue fragment, in `prisma/schema/auth-schema.prisma`) live in their own
 * files without a path collision — the same split Drizzle achieves with
 * separate `app/db/schema.ts` / `app/db/auth-schema.ts` files.
 */
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema"),
});
