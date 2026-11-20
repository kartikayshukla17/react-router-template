import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePlanFragmentPaths } from "../src/cli/resolve-plan-paths.js";
import { resolve } from "../src/resolver/resolve.js";
import { isErrors, type Selections } from "../src/resolver/types.js";
import { NodeFileSystem } from "../src/scaffolder/fs/node-fs.js";
import { scaffold } from "../src/scaffolder/scaffold.js";

/**
 * Ticket 017's file-list snapshot test: for every *valid* combination the
 * resolver can produce — enumerated here via `resolve()` itself, never a
 * hand-written list of combos — scaffold it for real (`NodeFileSystem`,
 * real fragment files, a fresh temp dir per combo, no `copyBaseTemplate`:
 * only `scaffold()`'s own `writtenPaths` is the thing a provider/glue
 * change could silently break) and assert the sorted file list against a
 * single committed snapshot. One combined snapshot, not one per combo:
 * the valid-combination *set* itself (which combos exist at all) is what
 * this test protects, and a changed set shows up as a diff in one place
 * instead of hundreds of pass/fail lines.
 *
 * `extras.example` is pinned to `true` here, not enumerated: demo
 * inclusion/stripping already has dedicated, focused coverage
 * (`demo-stripping.test.ts`, ticket 016) — doubling every combo here to
 * also vary it would roughly double this test's run time for coverage
 * this suite doesn't exist to own.
 *
 * Any new valid combination the resolver starts accepting (a new
 * provider, a loosened `requires`) changes this snapshot's shape —
 * failing loudly until a human reviews `vitest -u`'s diff and commits it,
 * per the ticket's "a deliberate, reviewed step."
 */

const AUTH_VALUES = [
  undefined,
  "better-auth",
  "clerk",
  "supabase-auth",
  "firebase-auth",
  "convex-auth",
] as const;
const STORAGE_VALUES = [undefined, "s3-presigned", "supabase-storage", "firebase-storage"] as const;
const REALTIME_VALUES = [undefined, "convex", "supabase-realtime"] as const;

function* crossCutting(base: Selections): Generator<Selections> {
  for (const auth of AUTH_VALUES) {
    for (const storage of STORAGE_VALUES) {
      for (const realtime of REALTIME_VALUES) {
        yield {
          ...base,
          ...(auth ? { auth } : {}),
          ...(storage ? { storage } : {}),
          ...(realtime ? { realtime } : {}),
          extras: { shadcn: false, docker: false, example: true },
        };
      }
    }
  }
}

/**
 * Every plausible `Selections` worth asking `resolve()` about — most are
 * invalid (a wrong orm/database pairing, an unsupported host) and dropped
 * below; enumerating the *inputs* by hand is unavoidable (something has
 * to name "postgres"/"neon"/"drizzle" as strings that exist), but which
 * ones are *valid* is decided entirely by `resolve()`, never asserted
 * here. Nested, not a flat cartesian product over every field at once:
 * `postgresHost` only varies when `database` is `"postgres"`, etc. — a
 * flat product would otherwise multiply in irrelevant-field duplicates
 * that `resolve()` treats identically.
 */
function* enumerateSelections(): Generator<Selections> {
  yield* crossCutting({});

  for (const orm of ["drizzle", "prisma"] as const) {
    yield* crossCutting({ database: "sqlite", orm });
  }

  for (const postgresHost of ["docker", "neon", "supabase"] as const) {
    for (const orm of ["drizzle", "prisma"] as const) {
      yield* crossCutting({ database: "postgres", postgresHost, orm });
    }
  }

  for (const mongoHost of ["docker", "hosted"] as const) {
    yield* crossCutting({ database: "mongodb", mongoHost, orm: "mongoose" });
  }

  yield { database: "convex", extras: { shadcn: false, docker: false, example: true } };
}

/**
 * Deterministic across runs regardless of object key insertion order, at
 * every nesting level — `JSON.stringify`'s array-replacer form only
 * allowlists keys by name, recursively, so it can't do this on its own
 * (a top-level allowlist like `["extras"]` would also apply inside
 * `extras` itself, collapsing it to `{}`).
 */
function sortedKey(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(sortedKey).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${sortedKey(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

describe("Every valid combination's file list (ticket 017)", () => {
  it("matches the committed snapshot", async () => {
    const combos: Array<{ key: string; files: string[] }> = [];

    for (const selections of enumerateSelections()) {
      const result = resolve(selections);
      if (isErrors(result)) {
        continue;
      }

      const plan = resolvePlanFragmentPaths(result);
      const targetDir = await mkdtemp(path.join(os.tmpdir(), "rr-stack-combo-"));
      const scaffoldResult = await scaffold(plan, targetDir, new NodeFileSystem());
      if (!scaffoldResult.ok) {
        await rm(targetDir, { recursive: true, force: true });
        throw new Error(
          `scaffold() failed for ${sortedKey(selections)}: ${scaffoldResult.error.message}`,
        );
      }

      const files = scaffoldResult.writtenPaths
        .map((writtenPath) => path.relative(targetDir, writtenPath))
        .sort();
      combos.push({ key: sortedKey(selections), files });
      await rm(targetDir, { recursive: true, force: true });
    }

    combos.sort((a, b) => a.key.localeCompare(b.key));

    expect(combos.length).toBeGreaterThan(0);
    expect(combos).toMatchSnapshot();
  });

  it("rejects a deliberately invalid combination (Mongoose + Postgres) — the matrix doesn't silently skip earlier filtering", () => {
    const result = resolve({ database: "postgres", postgresHost: "docker", orm: "mongoose" });
    expect(isErrors(result)).toBe(true);
  });
});
