import type { Glue } from "../../resolver/types.js";

/**
 * Wires Prisma's `app/server/db.ts` against Supabase's direct Postgres
 * connection string — a normal Postgres wire-protocol connection, same
 * "no driver adapter needed" story as `prismaPostgresDockerGlue`.
 * Supabase's direct connection isn't an HTTP/serverless protocol, so it
 * reuses Prisma's standard engine rather than needing
 * `@prisma/adapter-neon`-style wiring.
 */
export const prismaPostgresSupabaseGlue: Glue = {
  between: ["prisma", "postgres-supabase"],
  files: "glue/prisma+postgres-supabase",
  fileManifest: ["app/server/db.ts", "prisma.config.ts", "prisma/schema/schema.prisma"],
};
