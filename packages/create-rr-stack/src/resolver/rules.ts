/**
 * Table-driven compatibility rules. Each rule inspects `Selections` and
 * returns a `ResolverError` when its requirement isn't met, or `null` when
 * it's satisfied (or doesn't apply). `resolve()` runs every rule and
 * collects violations — it never throws.
 */

import type { ResolverError, Selections } from "./types.js";

export interface Rule {
  id: string;
  check(selections: Selections): ResolverError | null;
}

const SUPPORTED_POSTGRES_HOSTS = ["docker"] as const;

export const rules: Rule[] = [
  {
    id: "postgres-requires-supported-host",
    check(selections) {
      if (selections.database !== "postgres") {
        return null;
      }

      const host = selections.postgresHost;
      if (host !== undefined && (SUPPORTED_POSTGRES_HOSTS as readonly string[]).includes(host)) {
        return null;
      }

      const supportedList = SUPPORTED_POSTGRES_HOSTS.join(", ");
      return {
        code: "POSTGRES_HOST_UNRESOLVABLE",
        message:
          host === undefined
            ? `database "postgres" requires a "postgresHost" (one of: ${supportedList}).`
            : `postgresHost "${host}" is not supported yet (one of: ${supportedList}).`,
        layer: "database",
      };
    },
  },
];
