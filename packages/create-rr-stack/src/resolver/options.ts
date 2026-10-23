/**
 * Prompt options for a given layer, aware of selections already made
 * (`partial`) so the CLI shell can grey out choices that would be
 * unresolvable. Pure, like `resolve()` — no I/O.
 */

import { findProvider } from "../providers/registry.js";
import { providerAvailabilityChecks } from "./rules.js";
import type { Constraint, Layer, Option, Selections } from "./types.js";

const DATABASE_OPTIONS: Option[] = [{ value: "postgres", label: "PostgreSQL" }];
const ORM_OPTIONS: Option[] = [{ value: "drizzle", label: "Drizzle" }];
const AUTH_OPTIONS: Option[] = [{ value: "better-auth", label: "Better Auth" }];

const REGISTERED_OPTIONS: Record<Layer, Option[]> = {
  database: DATABASE_OPTIONS,
  orm: ORM_OPTIONS,
  auth: AUTH_OPTIONS,
  storage: [],
  realtime: [],
  // No prompt ever asks for "baas" directly — `resolve()`'s
  // `selectBaasClients()` is the only thing that adds a baas-layer
  // provider to a Plan. See `resolver/types.ts`'s `Layer` doc comment.
  baas: [],
};

function unmetConstraintReason(
  constraints: Constraint[] | undefined,
  partial: Selections,
  kind: "requires" | "conflicts",
): string | undefined {
  for (const constraint of constraints ?? []) {
    const actual = partial[constraint.layer] as string | undefined;
    const satisfied =
      kind === "requires"
        ? actual !== undefined && constraint.oneOf.includes(actual)
        : actual === undefined || !constraint.oneOf.includes(actual);

    if (!satisfied) {
      return kind === "requires"
        ? `requires ${constraint.layer} to be one of: ${constraint.oneOf.join(", ")}`
        : `conflicts with ${constraint.layer} "${actual}"`;
    }
  }
  return undefined;
}

export function options(layer: Layer, partial: Selections): Option[] {
  const registered = REGISTERED_OPTIONS[layer] ?? [];

  return registered.map((option) => {
    const provider = findProvider(layer, option.value);
    const reason =
      unmetConstraintReason(provider?.requires, partial, "requires") ??
      unmetConstraintReason(provider?.conflicts, partial, "conflicts") ??
      providerAvailabilityChecks[option.value]?.(partial);

    if (reason === undefined) {
      return { ...option };
    }
    return { ...option, disabled: true, reason };
  });
}
