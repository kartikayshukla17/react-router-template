import type { Glue } from "../../resolver/types.js";

/**
 * Wires Prisma's `app/server/db.ts` against Neon's serverless driver via
 * `@prisma/adapter-neon`'s `PrismaNeonHTTP` class (verified empirically,
 * 2026-10-23: `new PrismaNeonHTTP(connectionString, {})` passed as
 * `PrismaClient({ adapter })`, no WebSocket/`ws` dependency needed — that's
 * only required for `PrismaNeon`'s pooled/transaction-capable variant,
 * which this demo's simple single-document operations don't need).
 * Mirrors `drizzle+postgres-neon`'s choice of Neon's HTTP driver
 * (`drizzle-orm/neon-http`) over its WebSocket pool driver, for the same
 * reason: no persistent connection needed for simple request/response
 * queries.
 *
 * `previewFeatures = ["driverAdapters"]` is deliberately NOT set in
 * `prisma/schema/schema.prisma` — verified empirically against Prisma
 * 6.19.3 that the flag is already deprecated/a no-op at this version
 * (`prisma generate` prints `Preview feature "driverAdapters" is
 * deprecated. The functionality can be used without specifying it as a
 * preview feature.`), so the generator block stays byte-identical to the
 * other three `prisma+<host>` fragments' generator blocks — only the
 * `datasource` block's intent (served via a driver adapter vs. directly)
 * and `app/server/db.ts` differ for Neon.
 */
export const prismaPostgresNeonGlue: Glue = {
  between: ["prisma", "postgres-neon"],
  files: "glue/prisma+postgres-neon",
  deps: {
    "@prisma/adapter-neon": "^7.10.1",
  },
  fileManifest: ["app/server/db.ts", "prisma.config.ts", "prisma/schema/schema.prisma"],
};
