import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Selections } from "../resolver/types.js";

const require = createRequire(import.meta.url);

/**
 * Finds this package's own `package.json` by walking upward from this
 * module's location. Not a fixed `"../../package.json"`: the nesting depth
 * differs between running from source (`src/cli/project-record.ts`) and the
 * tsdown-bundled CLI (`dist/cli.mjs`, where this code ends up inlined one
 * level shallower).
 */
function findOwnPackageJson(): { version: string } {
  let dir = path.dirname(fileURLToPath(import.meta.url));

  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "package.json");
    if (existsSync(candidate)) {
      const pkg = require(candidate) as { name?: string; version: string };
      if (pkg.name === "create-rrstack") {
        return pkg;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  throw new Error("Could not locate create-rrstack's own package.json from cli/project-record.ts");
}

const ownPackageJson = findOwnPackageJson();

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

  await writeFile(
    path.join(targetDir, "rr-stack.json"),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
}
