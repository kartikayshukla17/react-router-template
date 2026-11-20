import type { Provider } from "../resolver/types.js";
import { betterAuthProvider } from "./auth/better-auth.js";
import { clerkProvider } from "./auth/clerk.js";
import { mongodbDockerProvider } from "./database/mongodb-docker.js";
import { mongodbHostedProvider } from "./database/mongodb-hosted.js";
import { postgresDockerProvider } from "./database/postgres-docker.js";
import { postgresNeonProvider } from "./database/postgres-neon.js";
import { postgresSupabaseProvider } from "./database/postgres-supabase.js";
import { sqliteProvider } from "./database/sqlite.js";
import { drizzleProvider } from "./orm/drizzle.js";
import { mongooseProvider } from "./orm/mongoose.js";
import { prismaProvider } from "./orm/prisma.js";

/**
 * All provider manifests a `Selections` field can name directly (looked up
 * via `findProvider(layer, id)`). Ticket 003 adds `database/postgres-neon`,
 * `orm/drizzle` and `auth/better-auth` alongside ticket 001's
 * `database/postgres-docker`; ticket 005 adds `database/postgres-supabase`
 * — later tickets add the rest of the database, ORM, auth, storage and
 * realtime layers here.
 *
 * Deliberately excludes `providers/baas/supabase-client.ts`: that fragment
 * is never named by a `Selections` field, only computed by
 * `resolver/resolve.ts`'s `selectBaasClients()` via
 * `providers/baas-registry.ts`.
 */
export const allProviders: readonly Provider[] = [
  postgresDockerProvider,
  postgresNeonProvider,
  postgresSupabaseProvider,
  sqliteProvider,
  mongodbDockerProvider,
  mongodbHostedProvider,
  drizzleProvider,
  mongooseProvider,
  prismaProvider,
  betterAuthProvider,
  clerkProvider,
];

export function findProvider(layer: Provider["layer"], id: string): Provider | undefined {
  return allProviders.find((provider) => provider.layer === layer && provider.id === id);
}
