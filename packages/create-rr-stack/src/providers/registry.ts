import type { Provider } from "../resolver/types.js";
import { postgresDockerProvider } from "./database/postgres-docker.js";

/**
 * All provider manifests known to the engine. This ticket registers exactly
 * one (`database/postgres-docker`) — later tickets add the rest of the
 * database, ORM, auth, storage and realtime layers here.
 */
export const allProviders: readonly Provider[] = [postgresDockerProvider];

export function findProvider(layer: Provider["layer"], id: string): Provider | undefined {
  return allProviders.find((provider) => provider.layer === layer && provider.id === id);
}
