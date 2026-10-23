/**
 * Table-driven compatibility rules. Each rule inspects `Selections` and
 * returns a `ResolverError` when its requirement isn't met, or `null` when
 * it's satisfied (or doesn't apply). `resolve()` runs every rule and
 * collects violations — it never throws.
 */

import { findProvider } from "../providers/registry.js";
import type { Layer, ResolverError, Selections } from "./types.js";

export interface Rule {
  id: string;
  check(selections: Selections): ResolverError | null;
}

const SUPPORTED_POSTGRES_HOSTS = ["docker", "neon"] as const;

/** Layers whose selection is a real provider id looked up directly in the registry. */
const REQUIRES_CHECKED_LAYERS: Layer[] = ["orm", "auth", "storage", "realtime"];

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
     * `orm/drizzle`'s own `app/server/db.ts` fragment is hand-written against
     * the Neon serverless driver (`drizzle-orm/neon-http`) because Neon is
     * the only Postgres host this ticket wires an ORM against. A different
     * host's driver (e.g. `node-postgres` for Docker) needs its own
     * host-specific fragment before `drizzle` can be offered there — tracked
     * for the Docker-host ticket, not re-litigated here.
     */
    id: "drizzle-requires-neon-host",
    check(selections) {
      if (selections.orm !== "drizzle") {
        return null;
      }
      if (selections.database === "postgres" && selections.postgresHost === "neon") {
        return null;
      }
      return {
        code: "ORM_HOST_UNSUPPORTED",
        message:
          'orm "drizzle" currently requires database "postgres" with postgresHost "neon" ' +
          "(other hosts aren't wired to a Drizzle driver fragment yet).",
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
