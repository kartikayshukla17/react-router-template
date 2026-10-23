/**
 * The stack resolver: a pure function from `Selections` to a `Plan` (or a
 * typed `Errors` value). No filesystem, network, or process access — every
 * input it needs arrives as an argument or from the static provider
 * registry, so it is trivially testable and safe to call speculatively
 * (e.g. while the CLI is still prompting).
 */

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

  if (selections.orm === "drizzle" && selections.auth === "better-auth") {
    const fragment = findGlue("drizzle", "better-auth");
    if (fragment) {
      glue.push(fragment);
    }
  }

  return glue;
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

  const providers = selectProviders(selections);
  const glue = selectGlue(selections);

  const plan: Plan = {
    providers,
    glue,
    installOrder: providers.map((provider) => provider.id),
    env: providers.flatMap((provider) => provider.env),
    nextSteps: providers.flatMap((provider) => provider.nextSteps),
  };

  return plan;
}
