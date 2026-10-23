/**
 * The stack resolver: a pure function from `Selections` to a `Plan` (or a
 * typed `Errors` value). No filesystem, network, or process access — every
 * input it needs arrives as an argument or from the static provider
 * registry, so it is trivially testable and safe to call speculatively
 * (e.g. while the CLI is still prompting).
 */

import { findBaasClientProvider } from "../providers/baas-registry.js";
import { findGlue } from "../providers/glue-registry.js";
import { findProvider } from "../providers/registry.js";
import { rules } from "./rules.js";
import type { Glue, Plan, Provider, ResolveResult, ResolverError, Selections } from "./types.js";

function selectProviders(selections: Selections): Provider[] {
  const selected: Provider[] = [];

  if (selections.database === "postgres" && selections.postgresHost === "docker") {
    const provider = findProvider("database", "postgres-docker");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.database === "postgres" && selections.postgresHost === "neon") {
    const provider = findProvider("database", "postgres-neon");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.database === "postgres" && selections.postgresHost === "supabase") {
    const provider = findProvider("database", "postgres-supabase");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.orm === "drizzle") {
    const provider = findProvider("orm", "drizzle");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.auth === "better-auth") {
    const provider = findProvider("auth", "better-auth");
    if (provider) {
      selected.push(provider);
    }
  }

  return selected;
}

function selectGlue(selections: Selections): Glue[] {
  const glue: Glue[] = [];

  if (selections.orm === "drizzle" && selections.database === "postgres") {
    // Host-specific driver wiring for `app/server/db.ts`: Neon's HTTP driver
    // vs. a plain TCP `postgres` client for Docker/Supabase. Exactly one of
    // these host provider ids is ever selected alongside `drizzle` (enforced
    // by `postgres-requires-supported-host` + `drizzle-requires-supported-host`
    // in rules.ts), so at most one of these lookups ever succeeds.
    const hostProviderId =
      selections.postgresHost === "docker"
        ? "postgres-docker"
        : selections.postgresHost === "neon"
          ? "postgres-neon"
          : selections.postgresHost === "supabase"
            ? "postgres-supabase"
            : undefined;
    const fragment = hostProviderId ? findGlue("drizzle", hostProviderId) : undefined;
    if (fragment) {
      glue.push(fragment);
    }
  }

  if (selections.orm === "drizzle" && selections.auth === "better-auth") {
    const fragment = findGlue("drizzle", "better-auth");
    if (fragment) {
      glue.push(fragment);
    }
  }

  return glue;
}

/**
 * The shared-BaaS-client dedup rule (PRD §8: `Provider.baas` — "shared
 * client installed once"). Scans the already-selected providers for every
 * distinct `baas` value they declare (e.g. `"supabase"`), then includes
 * the one canonical client provider for each — via
 * `providers/baas-registry.ts`'s `findBaasClientProvider()` — exactly
 * once, no matter how many selected providers declare the same `baas`.
 *
 * This is what makes the "installed once" guarantee structural rather than
 * a collision check the scaffolder has to win: by construction, the
 * shared fragment is added to `providers` at most once per distinct
 * `baas` value *before* `scaffold()` ever sees the plan, so a second
 * `baas: "supabase"` provider never gets the chance to attempt writing
 * `app/server/supabase-client.ts` a second time.
 *
 * Exported (not just used internally by `resolve()`) so this rule can be
 * unit-tested directly against a locally-constructed stub provider ahead
 * of a second *real* `baas: "supabase"` provider landing in the registry
 * (tickets 010/014/015) — see `test/resolver.test.ts`.
 */
export function selectBaasClients(providers: readonly Provider[]): Provider[] {
  const neededBaas = new Set<NonNullable<Provider["baas"]>>();
  for (const provider of providers) {
    if (provider.baas) {
      neededBaas.add(provider.baas);
    }
  }

  const clients: Provider[] = [];
  for (const baas of neededBaas) {
    const client = findBaasClientProvider(baas);
    if (client) {
      clients.push(client);
    }
  }
  return clients;
}

/**
 * Resolves a set of selections into a `Plan`, or into an `Errors` value
 * describing every unresolvable requirement. Never throws: an invalid or
 * incomplete selection is an ordinary return value, not an exception.
 */
export function resolve(selections: Selections): ResolveResult {
  const errors = rules
    .map((rule) => rule.check(selections))
    .filter((error): error is ResolverError => error !== null);

  if (errors.length > 0) {
    return { errors };
  }

  const selectedProviders = selectProviders(selections);
  const glue = selectGlue(selections);
  const providers = [...selectedProviders, ...selectBaasClients(selectedProviders)];

  const plan: Plan = {
    providers,
    glue,
    installOrder: providers.map((provider) => provider.id),
    env: providers.flatMap((provider) => provider.env),
    nextSteps: providers.flatMap((provider) => provider.nextSteps),
  };

  return plan;
}
