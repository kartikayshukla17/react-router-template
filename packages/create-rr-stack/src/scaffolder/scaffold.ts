/**
 * The scaffolder: takes a `Plan` and writes it to `targetDir` through an
 * injectable `FileSystem`. No module-level disk access — the exact same
 * code path runs against `MemoryFileSystem` in tests and `NodeFileSystem`
 * at runtime.
 *
 * Merge discipline (PRD.md §9): fragments add whole files at their own
 * paths, or change shared files (`package.json`, `.env.example`) only
 * through the structured mergers in `merge/`. Two fragments claiming the
 * same output path is a hard failure, not a silent overwrite.
 */

import type { Plan } from "../resolver/types.js";
import { mergeEnvExample } from "./merge/env-example.js";
import { mergePackageJson } from "./merge/package-json.js";
import { dirnamePath, joinPath } from "./paths.js";
import type { FileSystem, ScaffoldResult } from "./types.js";

/** A provider or glue fragment, viewed uniformly as "an id that owns some files". */
interface Fragment {
  id: string;
  files: string;
  fileManifest: readonly string[];
}

function fragmentsOf(plan: Plan): Fragment[] {
  return [
    ...plan.providers.map((provider) => ({
      id: provider.id,
      files: provider.files,
      fileManifest: provider.fileManifest,
    })),
    ...plan.glue.map((glue) => ({
      id: `${glue.between[0]}+${glue.between[1]}`,
      files: glue.files,
      fileManifest: glue.fileManifest,
    })),
  ];
}

export async function scaffold(
  plan: Plan,
  targetDir: string,
  fs: FileSystem,
): Promise<ScaffoldResult> {
  const fragments = fragmentsOf(plan);

  const collision = detectPathCollisions(fragments, targetDir);
  if (collision) {
    return { ok: false, error: collision };
  }

  const writtenPaths: string[] = [];

  for (const fragment of fragments) {
    for (const relativeFile of fragment.fileManifest) {
      const sourcePath = joinPath(fragment.files, relativeFile);
      const content = await fs.readFile(sourcePath);
      if (content === undefined) {
        return {
          ok: false,
          error: {
            code: "MISSING_FRAGMENT_FILE",
            message: `Fragment "${fragment.id}" declares "${relativeFile}" but it is missing from its source at "${sourcePath}".`,
            path: sourcePath,
          },
        };
      }

      const outputPath = joinPath(targetDir, relativeFile);
      await fs.mkdir(dirnamePath(outputPath));
      await fs.writeFile(outputPath, content);
      writtenPaths.push(outputPath);
    }
  }

  const packageJsonPath = joinPath(targetDir, "package.json");
  const existingPackageJson = await fs.readFile(packageJsonPath);
  await fs.writeFile(
    packageJsonPath,
    mergePackageJson(existingPackageJson, plan.providers, plan.glue),
  );
  writtenPaths.push(packageJsonPath);

  const envExamplePath = joinPath(targetDir, ".env.example");
  const existingEnvExample = await fs.readFile(envExamplePath);
  await fs.writeFile(envExamplePath, mergeEnvExample(existingEnvExample, plan.env));
  writtenPaths.push(envExamplePath);

  return { ok: true, writtenPaths };
}

/**
 * Filenames always written unconditionally after fragments, through the
 * structured mergers in `merge/`. A fragment that declares one of these as
 * one of its own output paths would otherwise be silently clobbered by the
 * merge step moments later with no error at all — so they're seeded as
 * pre-claimed paths below and treated exactly like a fragment-vs-fragment
 * collision.
 */
const MERGE_TARGET_FILENAMES = ["package.json", ".env.example"] as const;

function detectPathCollisions(
  fragments: readonly Fragment[],
  targetDir: string,
):
  | { code: "PATH_COLLISION"; message: string; path: string; fragments: [string, string] }
  | undefined {
  const claimedBy = new Map<string, string>();

  for (const filename of MERGE_TARGET_FILENAMES) {
    claimedBy.set(joinPath(targetDir, filename), filename);
  }

  for (const fragment of fragments) {
    for (const relativeFile of fragment.fileManifest) {
      const outputPath = joinPath(targetDir, relativeFile);
      const existingOwner = claimedBy.get(outputPath);

      if (existingOwner !== undefined && existingOwner !== fragment.id) {
        return {
          code: "PATH_COLLISION",
          message: `Path collision at "${outputPath}": both "${existingOwner}" and "${fragment.id}" write to this path.`,
          path: outputPath,
          fragments: [existingOwner, fragment.id],
        };
      }

      claimedBy.set(outputPath, fragment.id);
    }
  }

  return undefined;
}
