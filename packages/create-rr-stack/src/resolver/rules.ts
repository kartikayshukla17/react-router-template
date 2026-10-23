/**
 * Table-driven compatibility rules. Each rule inspects `Selections` and
 * returns a `ResolverError` when its requirement isn't met, or `null` when
 * it's satisfied (or doesn't apply). `resolve()` runs every rule and
 * collects violations — it never throws.
 */

import { findProvider } from "../providers/registry.js";
import type { ResolverError, SelectableLayer, Selections } from "./types.js";

export interface Rule {
  id: string;
  check(selections: Selections): ResolverError | null;
}

const SUPPORTED_POSTGRES_HOSTS = ["docker", "neon", "supabase"] as const;

/** Layers whose selection is a real provider id looked up directly in the registry. */
const REQUIRES_CHECKED_LAYERS: SelectableLayer[] = ["orm", "auth", "storage", "realtime"];

/**
 * Availability checks keyed by provider id, for constraints that `Provider.
 * requires`/`conflicts` can't express because `Constraint` only models
 * `{layer, oneOf}` pairs — not a sub-field like `postgresHost`. Each
 * function returns `undefined` when the provider is available given
 * `selections`, or a human-readable reason why it isn't.
 *
 * Exported (not just consumed by `rules` below) so `resolver/options.ts`
 * can consult the same table when computing `disabled`/`reason` for a
 * not-yet-fully-selected combination — "drizzle requires a host with a
 * driver fragment" is one fact, checked the same way whether it's
 * rejecting a completed selection (`resolve()`) or greying out a prompt
 * option (`options()`).
 *
 * Each check only judges what it specifically knows about (here:
 * `postgresHost`) and stays silent (returns `undefined`) when `database`
 * isn't `"postgres"` yet or `postgresHost` hasn't been chosen yet — those
 * cases are already owned by the provider's own `requires` constraint
 * (`database in [postgres]`) and by `postgres-requires-supported-host`
 * respectively, so this table doesn't duplicate or pre-empt them.
 *
 * Ticket 004 gave Docker a real `drizzle+postgres-docker` driver fragment
 * (node-postgres via the `postgres` package), so Drizzle is now available
 * for both `neon` and `docker`. Ticket 005 adds `drizzle+postgres-supabase`
 * (Supabase's direct connection string is a normal Postgres wire-protocol
 * connection, so it reuses the same `postgres`-package driver family as
 * Docker). The explicit allowlist stays (rather than just returning
 * `undefined` unconditionally) so a future host without a matching
 * `drizzle+<host>` glue fragment is disabled by default.
 */
export const DRIZZLE_SUPPORTED_POSTGRES_HOSTS = ["neon", "docker", "supabase"] as const;

export const providerAvailabilityChecks: Record<
  string,
  (selections: Selections) => string | undefined
> = {
  drizzle(selections) {
    if (selections.database !== "postgres") {
      return undefined;
    }
    if (
      selections.postgresHost === undefined ||
      (DRIZZLE_SUPPORTED_POSTGRES_HOSTS as readonly string[]).includes(selections.postgresHost)
    ) {
      return undefined;
    }
    return `requires postgresHost to be one of: ${DRIZZLE_SUPPORTED_POSTGRES_HOSTS.join(", ")} (other hosts aren't wired to a Drizzle driver fragment yet)`;
  },
};

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
  {
    /**
     * `app/server/db.ts` is built by a host-specific `drizzle+<host>` glue
     * fragment (`drizzle+postgres-neon` or `drizzle+postgres-docker`), each
     * wiring up the driver that host actually needs (Neon's HTTP driver vs.
     * a plain TCP `postgres` client for Docker). A future host without a
     * matching glue fragment still can't offer Drizzle — tracked here via
     * `providerAvailabilityChecks.drizzle`, not re-litigated per host.
     */
    id: "drizzle-requires-supported-host",
    check(selections) {
      if (selections.orm !== "drizzle") {
        return null;
      }
      const reason = providerAvailabilityChecks.drizzle?.(selections);
      if (reason === undefined) {
        return null;
      }
      return {
        code: "ORM_HOST_UNSUPPORTED",
        message: `orm "drizzle" currently ${reason}.`,
        layer: "orm",
      };
    },
  },
  {
    /**
     * Generic requires/conflicts check driven entirely by each selected
     * provider's own manifest (`Provider.requires`/`Provider.conflicts`),
     * rather than hard-coded per-combination logic. Covers, e.g., "orm
     * requires database in [postgres]" and "better-auth requires orm in
     * [drizzle] and database in [postgres]" (PRD §9) without this file
     * knowing those specifics — it only knows how to read the table.
     */
    id: "provider-requires-and-conflicts",
    check(selections) {
      for (const layer of REQUIRES_CHECKED_LAYERS) {
        const id = selections[layer];
        if (!id) {
          continue;
        }

        const provider = findProvider(layer, id);
        if (!provider) {
          continue;
        }

        for (const constraint of provider.requires ?? []) {
          const actual = selections[constraint.layer] as string | undefined;
          if (actual === undefined || !constraint.oneOf.includes(actual)) {
            return {
              code: "REQUIRES_NOT_MET",
              message: `"${provider.label}" requires ${constraint.layer} to be one of: ${constraint.oneOf.join(", ")}.`,
              layer,
            };
          }
        }

        for (const constraint of provider.conflicts ?? []) {
          const actual = selections[constraint.layer] as string | undefined;
          if (actual !== undefined && constraint.oneOf.includes(actual)) {
            return {
              code: "CONFLICTING_SELECTION",
              message: `"${provider.label}" conflicts with ${constraint.layer} "${actual}".`,
              layer,
            };
          }
        }
      }

      return null;
    },
  },
];
