/**
 * Flag parser for non-interactive mode (ticket 016) — every prompt the
 * interactive flow asks has a flag equivalent here, so the exact same
 * `resolve()`/`scaffold()` path backs both. Pure: no I/O, no `process.exit`
 * — `run.ts` decides what to do with a non-empty `errors` list.
 *
 * `--mongo-host` isn't in the PRD's own flag list, but `--postgres-host`
 * is, and `database: "mongodb"` needs a host exactly the same way
 * `database: "postgres"` does (`resolver/rules.ts`'s `mongodb-requires-
 * supported-host`) — omitting it would make `--db mongodb --yes` always
 * fail to resolve, so it's added here for the same reason `--postgres-
 * host` exists, not a scope expansion of its own.
 */

import type { Selections } from "../resolver/types.js";
import type { PackageManager } from "./detect-package-manager.js";

export interface Extras {
  shadcn: boolean;
  docker: boolean;
  example: boolean;
}

export interface ParsedArgs {
  projectName: string | undefined;
  selections: Selections;
  extras: Extras;
  yes: boolean;
  noInstall: boolean;
  noGit: boolean;
  pm: PackageManager | undefined;
  errors: string[];
}

/**
 * The `--yes` baseline (PRD's "fills any unspecified flag with the
 * resolver's documented defaults" — this constant *is* that
 * documentation): SQLite + Drizzle, no auth/storage/realtime. Every piece
 * needs zero third-party account or local daemon (no Docker, no Neon/
 * Supabase/Clerk/Firebase signup) — the one combination that's genuinely
 * runnable immediately after `--yes`, which is the whole point of a
 * no-prompts default for scripts and AI agents. `resolve()` accepts this
 * combination cleanly (see `test/resolver.test.ts`'s "resolves sqlite
 * alone" case) — asserted again here by `DEFAULT_SELECTIONS` resolving
 * with no errors, so a change to either side that breaks the pairing
 * fails loudly.
 */
export const DEFAULT_SELECTIONS: Selections = {
  database: "sqlite",
  orm: "drizzle",
};

/**
 * `DEFAULT_SELECTIONS` plus the conditional backstops a flag-driven
 * (non-interactive) run still needs, keyed on whichever `database` ends
 * up chosen — `--db postgres`/`--db mongodb` without a host wouldn't
 * resolve at all otherwise (`resolver/rules.ts`'s `postgres-requires-
 * supported-host`/`mongodb-requires-supported-host`), and there's no
 * prompt to fall back on here. "Docker" (not Neon/Supabase, not a hosted
 * hand-off) for the same zero-third-party-account reason `DEFAULT_
 * SELECTIONS` itself picks SQLite — the only hosts this CLI can get
 * "working" without the user visiting a dashboard first.
 *
 * Deliberately NOT a blanket `{...DEFAULT_SELECTIONS, ...selections}`
 * spread: `DEFAULT_SELECTIONS.orm` is `"drizzle"`, a SQL-only ORM that
 * `resolver/rules.ts` rejects outright alongside `database: "mongodb"`
 * (and Convex allows no ORM at all) — the ORM default has to follow
 * whichever database was actually chosen, not apply unconditionally.
 */
export function withDefaults(selections: Selections): Selections {
  // Non-null: DEFAULT_SELECTIONS.database is always set (see above).
  const database = selections.database ?? (DEFAULT_SELECTIONS.database as string);
  const merged: Selections = { ...selections, database };

  if (database === "postgres") {
    merged.postgresHost ??= "docker";
    merged.orm ??= "drizzle";
  } else if (database === "mongodb") {
    merged.mongoHost ??= "docker";
    merged.orm ??= "mongoose";
  } else if (database === "sqlite") {
    merged.orm ??= "drizzle";
  }
  // Convex ("convex"): no ORM default — Convex has none, and a stray
  // `--orm` alongside `--db convex` is a real conflict resolve() rejects,
  // not something this helper should paper over.

  return merged;
}

const VALID_PACKAGE_MANAGERS: readonly PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

const NONE = "none";

function isNone(value: string): boolean {
  return value === NONE;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const selections: Selections = {};
  const extras: Extras = { shadcn: false, docker: false, example: true };
  const errors: string[] = [];
  let projectName: string | undefined;
  let yes = false;
  let noInstall = false;
  let noGit = false;
  let pm: PackageManager | undefined;

  function takeValue(flag: string, index: number): string | undefined {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      errors.push(`${flag} requires a value.`);
      return undefined;
    }
    return value;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }

    switch (arg) {
      case "--db": {
        const value = takeValue(arg, i++);
        if (value) {
          selections.database = value;
        }
        break;
      }
      case "--postgres-host": {
        const value = takeValue(arg, i++);
        if (value) {
          selections.postgresHost = value as "docker" | "neon" | "supabase";
        }
        break;
      }
      case "--mongo-host": {
        const value = takeValue(arg, i++);
        if (value) {
          selections.mongoHost = value as "docker" | "hosted";
        }
        break;
      }
      case "--orm": {
        const value = takeValue(arg, i++);
        if (value && !isNone(value)) {
          selections.orm = value;
        }
        break;
      }
      case "--auth": {
        const value = takeValue(arg, i++);
        if (value && !isNone(value)) {
          selections.auth = value;
        }
        break;
      }
      case "--storage": {
        const value = takeValue(arg, i++);
        if (value && !isNone(value)) {
          selections.storage = value;
        }
        break;
      }
      case "--realtime": {
        const value = takeValue(arg, i++);
        if (value && !isNone(value)) {
          selections.realtime = value;
        }
        break;
      }
      case "--shadcn":
        extras.shadcn = true;
        break;
      case "--docker":
        extras.docker = true;
        break;
      case "--no-example":
        extras.example = false;
        break;
      case "--no-install":
        noInstall = true;
        break;
      case "--no-git":
        noGit = true;
        break;
      case "--yes":
        yes = true;
        break;
      case "--pm": {
        const value = takeValue(arg, i++);
        if (value) {
          if ((VALID_PACKAGE_MANAGERS as readonly string[]).includes(value)) {
            pm = value as PackageManager;
          } else {
            errors.push(
              `--pm "${value}" isn't supported (one of: ${VALID_PACKAGE_MANAGERS.join(", ")}).`,
            );
          }
        }
        break;
      }
      default:
        if (arg.startsWith("--")) {
          errors.push(`Unknown flag: ${arg}.`);
        } else if (projectName === undefined) {
          projectName = arg;
        } else {
          errors.push(`Unexpected extra argument: "${arg}".`);
        }
    }
  }

  return { projectName, selections, extras, yes, noInstall, noGit, pm, errors };
}
