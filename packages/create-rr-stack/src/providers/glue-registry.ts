import type { Glue } from "../resolver/types.js";
import {
  betterAuthDrizzleGlue,
  betterAuthDrizzlePostgresSchemaGlue,
  betterAuthDrizzleSqliteSchemaGlue,
} from "./glue/better-auth-drizzle.js";
import { betterAuthMongooseGlue } from "./glue/better-auth-mongoose.js";
import { betterAuthPrismaGlue } from "./glue/better-auth-prisma.js";
import { drizzlePostgresDockerGlue } from "./glue/drizzle-postgres-docker.js";
import { drizzlePostgresNeonGlue } from "./glue/drizzle-postgres-neon.js";
import { drizzlePostgresSupabaseGlue } from "./glue/drizzle-postgres-supabase.js";
import { drizzleSqliteGlue } from "./glue/drizzle-sqlite.js";
import { mongooseMongodbGlue } from "./glue/mongoose-mongodb.js";
import { prismaPostgresDockerGlue } from "./glue/prisma-postgres-docker.js";
import { prismaPostgresNeonGlue } from "./glue/prisma-postgres-neon.js";
import { prismaPostgresSupabaseGlue } from "./glue/prisma-postgres-supabase.js";
import { prismaSqliteGlue } from "./glue/prisma-sqlite.js";

/** All cross-layer glue fragments known to the engine (PRD §9 "Cross-layer glue"). */
export const allGlue: readonly Glue[] = [
  betterAuthDrizzleGlue,
  betterAuthDrizzlePostgresSchemaGlue,
  betterAuthDrizzleSqliteSchemaGlue,
  betterAuthMongooseGlue,
  betterAuthPrismaGlue,
  drizzlePostgresNeonGlue,
  drizzlePostgresDockerGlue,
  drizzlePostgresSupabaseGlue,
  drizzleSqliteGlue,
  mongooseMongodbGlue,
  prismaPostgresNeonGlue,
  prismaPostgresDockerGlue,
  prismaPostgresSupabaseGlue,
  prismaSqliteGlue,
];

/** Finds a glue fragment connecting two provider ids, regardless of the order given. */
export function findGlue(providerIdA: string, providerIdB: string): Glue | undefined {
  return allGlue.find(
    (glue) =>
      (glue.between[0] === providerIdA && glue.between[1] === providerIdB) ||
      (glue.between[0] === providerIdB && glue.between[1] === providerIdA),
  );
}
