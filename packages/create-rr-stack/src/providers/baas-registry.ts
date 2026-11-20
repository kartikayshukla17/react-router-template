import type { Provider } from "../resolver/types.js";
import { firebaseClientProvider } from "./baas/firebase-client.js";
import { supabaseClientProvider } from "./baas/supabase-client.js";

/**
 * The one canonical shared-client provider per `Provider.baas` value.
 * Looked up by `resolver/resolve.ts`'s `selectBaasClients()` — never by
 * `providers/registry.ts`'s `findProvider(layer, id)`, since nothing in
 * `Selections` names a `baas` provider directly (see
 * `providers/baas/supabase-client.ts`'s doc comment for why).
 *
 * `convex` has no entry yet — intentionally `undefined` until ticket 012
 * adds a provider for it, exactly like `DRIZZLE_SUPPORTED_POSTGRES_HOSTS`
 * staying an explicit allowlist in `resolver/rules.ts`.
 */
const baasClientProviders: Partial<Record<NonNullable<Provider["baas"]>, Provider>> = {
  supabase: supabaseClientProvider,
  firebase: firebaseClientProvider,
};

export function findBaasClientProvider(baas: NonNullable<Provider["baas"]>): Provider | undefined {
  return baasClientProviders[baas];
}
