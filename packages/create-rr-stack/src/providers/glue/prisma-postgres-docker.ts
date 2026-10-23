import type { Glue } from "../../resolver/types.js";

/**
 * Wires Prisma's `app/server/db.ts` against a plain TCP Postgres connection
 * for the self-hosted Docker Compose database — the standard
 * `prisma-client-js` generator with no driver adapter, same as any
 * ordinary Postgres server Prisma's own binary/WASM query engine talks to
 * directly. Same shape as `prismaPostgresNeonGlue`, no adapter needed
 * (Neon's HTTP/serverless protocol is the one that needs
 * `@prisma/adapter-neon`; a normal Postgres wire-protocol server doesn't).
 */
export const prismaPostgresDockerGlue: Glue = {
  between: ["prisma", "postgres-docker"],
  files: "glue/prisma+postgres-docker",
  fileManifest: ["app/server/db.ts", "prisma.config.ts", "prisma/schema/schema.prisma"],
};
