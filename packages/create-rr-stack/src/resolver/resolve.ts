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

  if (selections.database === "sqlite") {
    const provider = findProvider("database", "sqlite");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.database === "mongodb" && selections.mongoHost === "docker") {
    const provider = findProvider("database", "mongodb-docker");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.database === "mongodb" && selections.mongoHost === "hosted") {
    const provider = findProvider("database", "mongodb-hosted");
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

  if (selections.orm === "mongoose") {
    const provider = findProvider("orm", "mongoose");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.orm === "prisma") {
    const provider = findProvider("orm", "prisma");
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

  if (selections.auth === "clerk") {
    const provider = findProvider("auth", "clerk");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.auth === "supabase-auth") {
    const provider = findProvider("auth", "supabase-auth");
    if (provider) {
      selected.push(provider);
    }
  }

  if (selections.auth === "firebase-auth") {
    const provider = findProvider("auth", "firebase-auth");
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

  if (selections.orm === "drizzle" && selections.database === "sqlite") {
    // SQLite has no host concept, so there's exactly one driver fragment
    // to pick, unconditionally, once SQLite is the selected database — no
    // `postgresHost`-style branching needed.
    const fragment = findGlue("drizzle", "sqlite");
    if (fragment) {
      glue.push(fragment);
    }
  }

  if (selections.orm === "drizzle" && selections.auth === "better-auth") {
    const wiring = findGlue("drizzle", "better-auth");
    if (wiring) {
      glue.push(wiring);
    }

    // The users-table schema is dialect-specific (ticket 006): look up the
    // sibling glue fragment keyed on `["better-auth", <dialect>]` — see
    // `betterAuthDrizzlePostgresSchemaGlue`/`betterAuthDrizzleSqliteSchemaGlue`
    // in `providers/glue/better-auth-drizzle.ts` for why the second id is
    // `selections.database` itself rather than a host provider id.
    if (selections.database) {
      const schemaFragment = findGlue("better-auth", selections.database);
      if (schemaFragment) {
        glue.push(schemaFragment);
      }
    }
  }

  if (selections.orm === "mongoose" && selections.database === "mongodb") {
    // Host-independent, unlike the Postgres branch above: Mongo has one
    // driver story for both `mongodb-docker` and `mongodb-hosted`, so this
    // is keyed on the dialect value `"mongodb"` directly rather than on
    // whichever host provider id was selected (see
    // `providers/glue/mongoose-mongodb.ts`'s doc comment).
    const fragment = findGlue("mongoose", "mongodb");
    if (fragment) {
      glue.push(fragment);
    }
  }

  if (selections.orm === "mongoose" && selections.auth === "better-auth") {
    // No dialect-keyed schema sibling needed here (MongoDB is schemaless) —
    // unlike the Drizzle branch above, this is the only glue fragment the
    // Mongoose + Better Auth combination needs.
    const wiring = findGlue("mongoose", "better-auth");
    if (wiring) {
      glue.push(wiring);
    }
  }

  if (selections.orm === "prisma" && selections.database === "postgres") {
    // Host-specific datasource/driver wiring for `app/server/db.ts` and
    // `prisma/schema/schema.prisma` — mirrors the Drizzle branch above.
    // Exactly one of these host provider ids is ever selected alongside
    // `prisma` (enforced by `postgres-requires-supported-host` +
    // `prisma-requires-supported-host` in rules.ts), so at most one of
    // these lookups ever succeeds.
    const hostProviderId =
      selections.postgresHost === "docker"
        ? "postgres-docker"
        : selections.postgresHost === "neon"
          ? "postgres-neon"
          : selections.postgresHost === "supabase"
            ? "postgres-supabase"
            : undefined;
    const fragment = hostProviderId ? findGlue("prisma", hostProviderId) : undefined;
    if (fragment) {
      glue.push(fragment);
    }
  }

  if (selections.orm === "prisma" && selections.database === "sqlite") {
    // SQLite has no host concept, so there's exactly one driver fragment
    // to pick, unconditionally, once SQLite is the selected database —
    // mirrors the Drizzle branch above.
    const fragment = findGlue("prisma", "sqlite");
    if (fragment) {
      glue.push(fragment);
    }
  }

  if (selections.orm === "prisma" && selections.auth === "better-auth") {
    // Unlike the Drizzle branch above, no second, dialect-keyed schema
    // fragment lookup is needed: `prisma/schema/auth-schema.prisma`'s
    // Prisma scalar types are connector-agnostic, so one `better-auth+
    // prisma` glue fragment covers every database/host combination (see
    // `providers/glue/better-auth-prisma.ts`'s doc comment).
    const wiring = findGlue("prisma", "better-auth");
    if (wiring) {
      glue.push(wiring);
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
