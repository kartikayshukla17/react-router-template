import type { Provider } from "../resolver/types.js";
import { betterAuthProvider } from "./auth/better-auth.js";
import { postgresDockerProvider } from "./database/postgres-docker.js";
import { postgresNeonProvider } from "./database/postgres-neon.js";
import { drizzleProvider } from "./orm/drizzle.js";

/**
 * All provider manifests known to the engine. Ticket 003 adds
 * `database/postgres-neon`, `orm/drizzle` and `auth/better-auth` alongside
 * ticket 001's `database/postgres-docker` — later tickets add the rest of
 * the database, ORM, auth, storage and realtime layers here.
 */
export const allProviders: readonly Provider[] = [
  postgresDockerProvider,
  postgresNeonProvider,
  drizzleProvider,
  betterAuthProvider,
];

export function findProvider(layer: Provider["layer"], id: string): Provider | undefined {
  return allProviders.find((provider) => provider.layer === layer && provider.id === id);
}
