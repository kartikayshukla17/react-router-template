/**
 * Prompt options for a given layer, aware of selections already made
 * (`partial`) so the CLI shell can grey out choices that would be
 * unresolvable. Pure, like `resolve()` — no I/O.
 */

import { findProvider } from "../providers/registry.js";
import { providerAvailabilityChecks } from "./rules.js";
import type { Constraint, Option, SelectableLayer, Selections } from "./types.js";

const DATABASE_OPTIONS: Option[] = [
  { value: "postgres", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite (local file)" },
  { value: "mongodb", label: "MongoDB" },
];
const ORM_OPTIONS: Option[] = [
  { value: "drizzle", label: "Drizzle" },
  { value: "prisma", label: "Prisma" },
  { value: "mongoose", label: "Mongoose" },
];
const AUTH_OPTIONS: Option[] = [
  { value: "better-auth", label: "Better Auth" },
  { value: "clerk", label: "Clerk" },
];

const REGISTERED_OPTIONS: Record<SelectableLayer, Option[]> = {
  database: DATABASE_OPTIONS,
  orm: ORM_OPTIONS,
  auth: AUTH_OPTIONS,
  storage: [],
  realtime: [],
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

export function options(layer: SelectableLayer, partial: Selections): Option[] {
  const registered = REGISTERED_OPTIONS[layer] ?? [];

  return registered.map((option) => {
    const provider = findProvider(layer, option.value);
    // `providerAvailabilityChecks` is consulted first, not last: it exists
    // precisely to give a *more specific* reason than the generic
    // requires/conflicts message would (e.g. "Drizzle and Prisma don't
    // support MongoDB" instead of "requires database to be one of:
    // postgres, sqlite"), so it must win whenever it applies. Providers
    // with no entry in that table (e.g. Mongoose, whose only constraint is
    // its own `requires`) fall straight through to the generic checks below,
    // unaffected by this ordering.
    const reason =
      providerAvailabilityChecks[option.value]?.(partial) ??
      unmetConstraintReason(provider?.requires, partial, "requires") ??
      unmetConstraintReason(provider?.conflicts, partial, "conflicts");

    if (reason === undefined) {
      return { ...option };
    }
    return { ...option, disabled: true, reason };
  });
}
