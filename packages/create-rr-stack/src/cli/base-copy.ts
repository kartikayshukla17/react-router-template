import { cp } from "node:fs/promises";
import path from "node:path";
import { templatesRoot } from "../providers/templates-root.js";

/**
 * Copies `templates/base` (the real, runnable React Router app) into the
 * target directory. This is a whole-directory copy of a fixed template, not
 * the scaffolder's job: the scaffolder's `FileSystem` seam intentionally has
 * no directory-listing primitive, and the base app isn't a `Provider`
 * fragment with a declared `fileManifest` — it's the thing fragments get
 * overlaid onto.
 *
 * Excludes build artifacts and lockfiles that belong to this repo's own
 * checked-in `templates/base`, not to the generated project.
 */
const EXCLUDED_NAMES = new Set([
  "node_modules",
  "build",
  ".react-router",
  "package-lock.json",
  ".git",
]);

export async function copyBaseTemplate(targetDir: string): Promise<void> {
  const baseDir = path.join(templatesRoot, "base");

  await cp(baseDir, targetDir, {
    recursive: true,
    filter: (source) => !EXCLUDED_NAMES.has(path.basename(source)),
  });
}
