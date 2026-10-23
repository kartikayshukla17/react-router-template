import type { Glue } from "../resolver/types.js";
import {
  betterAuthDrizzleGlue,
  betterAuthDrizzlePostgresSchemaGlue,
  betterAuthDrizzleSqliteSchemaGlue,
} from "./glue/better-auth-drizzle.js";
import { drizzlePostgresDockerGlue } from "./glue/drizzle-postgres-docker.js";
import { drizzlePostgresNeonGlue } from "./glue/drizzle-postgres-neon.js";
import { drizzlePostgresSupabaseGlue } from "./glue/drizzle-postgres-supabase.js";
import { drizzleSqliteGlue } from "./glue/drizzle-sqlite.js";

/** All cross-layer glue fragments known to the engine (PRD §9 "Cross-layer glue"). */
export const allGlue: readonly Glue[] = [
  betterAuthDrizzleGlue,
  betterAuthDrizzlePostgresSchemaGlue,
  betterAuthDrizzleSqliteSchemaGlue,
  drizzlePostgresNeonGlue,
  drizzlePostgresDockerGlue,
  drizzlePostgresSupabaseGlue,
  drizzleSqliteGlue,
];

/** Finds a glue fragment connecting two provider ids, regardless of the order given. */
export function findGlue(providerIdA: string, providerIdB: string): Glue | undefined {
  return allGlue.find(
    (glue) =>
      (glue.between[0] === providerIdA && glue.between[1] === providerIdB) ||
      (glue.between[0] === providerIdB && glue.between[1] === providerIdA),
  );
}
