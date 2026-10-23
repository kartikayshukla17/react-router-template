import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Selections } from "../resolver/types.js";

const require = createRequire(import.meta.url);
const ownPackageJson = require("../../package.json") as { version: string };

/** `rr-stack.json`'s shape (PRD.md §8 `ProjectRecord`). */
export interface ProjectRecord {
  cliVersion: string;
  selections: Selections;
  generatedAt: string;
}

/**
 * Writes `rr-stack.json` into the generated project root. Not part of the
 * scaffolder's `Plan`-driven file writing (it depends on the CLI's own
 * version and the current time, neither of which the pure resolver/plan
 * knows about), so it's a small CLI-side step run right after `scaffold()`.
 */
export async function writeProjectRecord(targetDir: string, selections: Selections): Promise<void> {
  const record: ProjectRecord = {
    cliVersion: ownPackageJson.version,
    selections,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(path.join(targetDir, "rr-stack.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
}
