import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolvePlanFragmentPaths } from "../src/cli/resolve-plan-paths.js";
import { resolve } from "../src/resolver/resolve.js";
import type { Plan, Selections } from "../src/resolver/types.js";
import { NodeFileSystem } from "../src/scaffolder/fs/node-fs.js";
import { scaffold } from "../src/scaffolder/scaffold.js";

/**
 * Ticket 008's "shared contract test" acceptance criterion: switching
 * between Drizzle and Prisma for the same database/host/auth combination
 * must only change files under the ORM's own fragment and the glue
 * fragment — `app/server/auth.ts`'s PUBLIC INTERFACE
 * (`getSession`/`requireUser`/`signOut`, PRD.md §9) must be identical
 * either way. "Identical" here means the exported function surface
 * (names + parameter count), not byte-identical source — the two
 * fragments' internal wiring (Better Auth's Drizzle adapter vs. its
 * Prisma adapter) is legitimately different code.
 *
 * Mechanism chosen: generate two REAL projects (via the actual `resolve()`
 * → `resolvePlanFragmentPaths()` → `scaffold()` pipeline, against the real
 * `NodeFileSystem`, into throwaway temp directories — the same pipeline
 * `cli/run.ts` drives at runtime, not a hand-rolled stand-in for it), then
 * extract every top-level exported function's name and parameter count
 * from each generated `app/server/auth.ts`.
 *
 * Extraction is a small, deliberately simple regex over `export [async]
 * function <name>(<params>)` — NOT the `typescript` compiler API: this
 * repo's pinned `typescript@^7.0.2` is the new Go-ported compiler, whose
 * npm package no longer ships the classic `createSourceFile`/`SyntaxKind`
 * JS parsing API at all (verified empirically — `typescript`'s only root
 * export is version metadata, and its `typescript/unstable/ast` subpath
 * exposes AST *types* and visitor helpers but no in-process parser
 * function). Reaching for that API would mean depending on an
 * admittedly-`unstable` subpath with no parse entry point, for marginal
 * benefit over a direct regex given this generated code's known, narrow
 * shape (a handful of flat, non-generic parameter lists — no nested
 * parens to trip up a naive comma count). Chosen over exact string
 * diffing (fragile: doc comments, import order, and internal wiring
 * legitimately differ between the two ORMs) and over a shared `.d.ts`
 * contract file (would require generating a type-only build artifact
 * neither fragment currently produces) — this is the simple, direct check
 * the ticket asks for, scoped to exactly what "same public surface" means
 * here: names and arities, not byte-for-byte source.
 */

interface ExportedFunctionSignature {
  name: string;
  paramCount: number;
}

const EXPORTED_FUNCTION_PATTERN = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;

function extractExportedFunctionSignatures(source: string): ExportedFunctionSignature[] {
  const signatures: ExportedFunctionSignature[] = [];

  for (const match of source.matchAll(EXPORTED_FUNCTION_PATTERN)) {
    const [, name, rawParams] = match;
    if (name === undefined || rawParams === undefined) {
      continue;
    }
    const trimmed = rawParams.trim();
    const paramCount = trimmed === "" ? 0 : trimmed.split(",").length;
    signatures.push({ name, paramCount });
  }

  return signatures.sort((a, b) => a.name.localeCompare(b.name));
}

/** The fixed cross-provider interface (PRD.md §9) this ticket's criterion names. */
const PUBLIC_INTERFACE_NAMES = ["getSession", "requireUser", "signOut"];

async function generateAuthTs(selections: Selections, tmpDirPrefix: string): Promise<string> {
  const result = resolve(selections);
  if ("errors" in result) {
    throw new Error(
      `resolve() returned errors for ${JSON.stringify(selections)}: ${JSON.stringify(result.errors)}`,
    );
  }
  const plan: Plan = resolvePlanFragmentPaths(result);

  const targetDir = await mkdtemp(path.join(os.tmpdir(), tmpDirPrefix));
  const scaffoldResult = await scaffold(plan, targetDir, new NodeFileSystem());
  if (!scaffoldResult.ok) {
    throw new Error(`scaffold() failed: ${scaffoldResult.error.message}`);
  }

  const authTsPath = path.join(targetDir, "app", "server", "auth.ts");
  const content = await readFile(authTsPath, "utf8");

  await rm(targetDir, { recursive: true, force: true });
  return content;
}

describe("Drizzle vs. Prisma auth.ts contract (ticket 008)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("exports the identical getSession/requireUser/signOut surface for Postgres+Docker, regardless of ORM", async () => {
    const base: Omit<Selections, "orm"> = {
      database: "postgres",
      postgresHost: "docker",
      auth: "better-auth",
    };

    const drizzleAuthTs = await generateAuthTs({ ...base, orm: "drizzle" }, "rr-stack-drizzle-");
    const prismaAuthTs = await generateAuthTs({ ...base, orm: "prisma" }, "rr-stack-prisma-");

    const drizzleSignatures = extractExportedFunctionSignatures(drizzleAuthTs);
    const prismaSignatures = extractExportedFunctionSignatures(prismaAuthTs);

    // Full surface (including the sign-in/up helpers) matches exactly —
    // both fragments happen to export the same five functions today.
    expect(prismaSignatures).toEqual(drizzleSignatures);

    // The PRD's fixed interface specifically, asserted by name so this
    // keeps failing loudly even if the "full surface" shape above ever
    // legitimately diverges for a function outside the fixed interface.
    for (const name of PUBLIC_INTERFACE_NAMES) {
      const drizzleFn = drizzleSignatures.find((s) => s.name === name);
      const prismaFn = prismaSignatures.find((s) => s.name === name);
      expect(drizzleFn, `Drizzle auth.ts should export ${name}`).toBeDefined();
      expect(prismaFn, `Prisma auth.ts should export ${name}`).toBeDefined();
      expect(prismaFn?.paramCount).toBe(drizzleFn?.paramCount);
    }
  });

  it("exports the identical getSession/requireUser/signOut surface for SQLite, regardless of ORM", async () => {
    const base: Omit<Selections, "orm"> = {
      database: "sqlite",
      auth: "better-auth",
    };

    const drizzleAuthTs = await generateAuthTs(
      { ...base, orm: "drizzle" },
      "rr-stack-drizzle-sqlite-",
    );
    const prismaAuthTs = await generateAuthTs(
      { ...base, orm: "prisma" },
      "rr-stack-prisma-sqlite-",
    );

    const drizzleSignatures = extractExportedFunctionSignatures(drizzleAuthTs);
    const prismaSignatures = extractExportedFunctionSignatures(prismaAuthTs);

    expect(prismaSignatures).toEqual(drizzleSignatures);
    for (const name of PUBLIC_INTERFACE_NAMES) {
      expect(prismaSignatures.find((s) => s.name === name)).toEqual(
        drizzleSignatures.find((s) => s.name === name),
      );
    }
  });
});
