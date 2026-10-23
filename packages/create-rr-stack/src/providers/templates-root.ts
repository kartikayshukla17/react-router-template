import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the repo's `templates/` directory, computed from this
 * module's own location rather than `process.cwd()`. Provider manifests use
 * it to build an absolute `files` path, so `NodeFileSystem` can read their
 * fragments regardless of which directory the CLI is invoked from.
 *
 * Walks upward from this file looking for a `templates/` sibling instead of
 * hard-coding a fixed number of `..` segments, because the exact depth
 * differs between running from source (`src/providers/...`) and running the
 * tsdown-bundled CLI (`dist/cli.mjs`), where this module's code ends up
 * inlined at a different nesting level.
 *
 * `templates/` isn't bundled into the published package yet (tracked for the
 * npm-publish ticket, 019) — this resolves correctly for running the CLI
 * from source or from `dist/` inside this monorepo checkout.
 */
function findTemplatesRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));

  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, "templates");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  throw new Error(
    "Could not locate the repo's templates/ directory from providers/templates-root.ts",
  );
}

export const templatesRoot = findTemplatesRoot();
