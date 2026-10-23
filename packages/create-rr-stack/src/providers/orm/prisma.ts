import { defineProvider } from "../define-provider.js";

/**
 * Prisma ORM (ticket 008) — the second SQL ORM choice, proving a layer can
 * have more than one provider without touching any other layer's
 * fragments. Dialect- and host-independent, same shape as `orm/drizzle`:
 * declares only the shared `prisma`/`@prisma/client`/`dotenv` deps and
 * `db:push`/`db:studio` scripts.
 *
 * Research finding (2026-10-23, verified empirically against a real
 * `npm install` + live Postgres container, not just read from docs):
 * current Prisma (6.19.3, the latest non-major-bump release — 8.0.0-rc.26
 * is only the `next` dist-tag, not `latest`/`prev`) uses a multi-file
 * schema folder (`prisma/schema/*.prisma`, no `prismaSchemaFolder` preview
 * flag needed — that flag is already deprecated/no-op at this version) so
 * the Note model (host-specific datasource + generator) and the Better
 * Auth users-table models can live in separate files, selected by separate
 * fragments, the same way Drizzle splits `app/db/schema.ts` from
 * `app/db/auth-schema.ts`. Unlike Drizzle, Prisma's column types
 * (`String`, `Boolean`, `DateTime`) are connector-agnostic, so — unlike
 * `better-auth+drizzle`'s Postgres/SQLite schema split — `better-auth+
 * prisma`'s `auth-schema.prisma` needs only ONE variant for every
 * database/host combination.
 *
 * `prisma.config.ts` (required once a config file is present — Prisma then
 * stops auto-loading `.env`, hence the explicit `dotenv/config` import
 * inside it) and `prisma/schema/schema.prisma` (datasource + generator +
 * the `Note` model) are dialect/host-specific in principle (the
 * `datasource` block's `provider`/`url`, and for Neon specifically the
 * driver-adapter wiring in `app/server/db.ts`) and so, mirroring
 * `orm/drizzle`'s reasoning exactly, ship from whichever `prisma+<host>` /
 * `prisma+sqlite` glue fragment matches the selection
 * (`resolver/resolve.ts`'s `selectGlue()`), not from this fileless
 * provider. Keeping `orm/prisma` itself fileless means there's nothing
 * here for a path collision to even be possible against — same reasoning
 * as `orm/drizzle`.
 *
 * `requires: database in [postgres, sqlite]` is the layer-level
 * constraint; the narrower "postgres must be a host with a driver
 * fragment" constraint lives in `resolver/rules.ts`
 * (`prisma-requires-supported-host`), mirroring
 * `drizzle-requires-supported-host`.
 */
export const prismaProvider = defineProvider({
  layer: "orm",
  id: "prisma",
  label: "Prisma",
  requires: [{ layer: "database", oneOf: ["postgres", "sqlite"] }],
  deps: {
    "@prisma/client": "^6.19.3",
    dotenv: "^18.0.9",
  },
  devDeps: {
    prisma: "^6.19.3",
  },
  env: [],
  files: "providers/orm/prisma",
  fileManifest: [],
  scripts: {
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
  },
  nextSteps: ["Run `npm run db:push` to create the notes table against the selected database."],
});
