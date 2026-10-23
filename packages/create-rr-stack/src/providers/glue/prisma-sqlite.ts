import type { Glue } from "../../resolver/types.js";

/**
 * Wires Prisma's `app/server/db.ts` against a local SQLite file, using
 * Prisma's standard `sqlite` connector (no driver adapter needed for a
 * plain local file, verified empirically against Prisma 6.19.3 — the
 * same "no adapter" story as the Docker/Supabase Postgres hosts). SQLite
 * has no `postgresHost`-style "which host" concept, so — mirroring
 * `drizzleSqliteGlue` — there's exactly one `prisma+sqlite` fragment,
 * selected whenever `selections.database === "sqlite"` regardless of any
 * host field (there is none).
 *
 * The file lives at `<project root>/sqlite.db`, same path Drizzle's SQLite
 * glue uses, so switching ORMs for an already-running SQLite project
 * doesn't orphan an old database file at a different path. The
 * `datasource` URL is relative to `prisma/schema/` (Prisma resolves a
 * SQLite `file:` URL relative to the schema file's directory), hence
 * `file:../../sqlite.db` — two levels up from `prisma/schema/schema.prisma`
 * to the project root.
 */
export const prismaSqliteGlue: Glue = {
  between: ["prisma", "sqlite"],
  files: "glue/prisma+sqlite",
  fileManifest: ["app/server/db.ts", "prisma.config.ts", "prisma/schema/schema.prisma"],
};
