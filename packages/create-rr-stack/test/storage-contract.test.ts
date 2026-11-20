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
 * Ticket 014's shared contract test: `app/server/storage.ts`'s
 * `getUploadUrl`/`getDownloadUrl`/`remove` (PRD.md §9) must be identical
 * in shape across S3/R2, Supabase, and Firebase. Same mechanism as
 * `auth-contract.test.ts` — generate real projects through resolve() →
 * scaffold(), extract exported function signatures with the same
 * deliberately simple regex.
 *
 * `getUploadUrl` is the one documented exception: S3/R2 (ticket 013)
 * takes an optional third `sha256Base64` parameter so a client-supplied
 * checksum can be baked into the signed command before signing — Supabase
 * and Firebase have no equivalent mechanism, so they stay at the PRD's
 * literal two. "Identical in shape" is checked as "every provider has at
 * least the fixed two-parameter baseline," not byte-for-byte arity
 * equality, the same spirit `auth-contract.test.ts` documents for
 * `getSession`/`requireUser`/`signOut`.
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

const FIXED_INTERFACE: Record<string, number> = {
  getUploadUrl: 2,
  getDownloadUrl: 1,
  remove: 1,
};

async function generateStorageTs(selections: Selections, tmpDirPrefix: string): Promise<string> {
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

  const storageTsPath = path.join(targetDir, "app", "server", "storage.ts");
  const content = await readFile(storageTsPath, "utf8");

  await rm(targetDir, { recursive: true, force: true });
  return content;
}

describe("Storage contract: getUploadUrl/getDownloadUrl/remove across S3/R2, Supabase, Firebase (ticket 014)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it.each([
    ["s3-presigned", "rr-stack-storage-contract-s3-"],
    ["supabase-storage", "rr-stack-storage-contract-supabase-"],
    ["firebase-storage", "rr-stack-storage-contract-firebase-"],
  ] as const)(
    "%s exposes the fixed getUploadUrl/getDownloadUrl/remove baseline",
    async (storage, prefix) => {
      const storageTs = await generateStorageTs({ storage }, prefix);
      const signatures = extractExportedFunctionSignatures(storageTs);

      for (const [name, minParamCount] of Object.entries(FIXED_INTERFACE)) {
        const fn = signatures.find((s) => s.name === name);
        expect(fn, `${storage}'s storage.ts should export ${name}`).toBeDefined();
        expect(
          fn?.paramCount,
          `${storage}'s ${name} should have at least ${minParamCount} params`,
        ).toBeGreaterThanOrEqual(minParamCount);
      }
    },
  );

  it("getDownloadUrl and remove are exactly 1 param across all three providers", async () => {
    const s3Ts = await generateStorageTs({ storage: "s3-presigned" }, "rr-stack-storage-arity-s3-");
    const supabaseTs = await generateStorageTs(
      { storage: "supabase-storage" },
      "rr-stack-storage-arity-supabase-",
    );
    const firebaseTs = await generateStorageTs(
      { storage: "firebase-storage" },
      "rr-stack-storage-arity-firebase-",
    );

    for (const source of [s3Ts, supabaseTs, firebaseTs]) {
      const signatures = extractExportedFunctionSignatures(source);
      expect(signatures.find((s) => s.name === "getDownloadUrl")?.paramCount).toBe(1);
      expect(signatures.find((s) => s.name === "remove")?.paramCount).toBe(1);
    }
  });
});
