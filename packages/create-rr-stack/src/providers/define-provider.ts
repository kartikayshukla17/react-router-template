import type { Provider } from "../resolver/types.js";

/**
 * Identity function giving every provider manifest a single, shared shape to
 * author against (PRD.md §9). It validates the minimum a manifest must
 * declare so a malformed provider fails loudly at module load time rather
 * than producing a silently-broken `Plan` later.
 */
export function defineProvider(provider: Provider): Provider {
  if (!provider.id) {
    throw new Error("defineProvider: a provider must have a non-empty id");
  }
  if (!provider.layer) {
    throw new Error(`defineProvider: provider "${provider.id}" must declare a layer`);
  }
  if (!provider.files) {
    throw new Error(`defineProvider: provider "${provider.id}" must declare a files folder`);
  }

  return provider;
}
