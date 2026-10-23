import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the repo's `templates/` directory, computed from this
 * module's own location rather than `process.cwd()`. Provider/glue
 * manifests declare their `files` field as a path *relative to this root*;
 * the scaffolder/CLI turns that into an absolute path only when it's about
 * to actually read a fragment's files off disk (at scaffold time).
 *
 * Deliberately **lazy and memoized**, not computed as a side effect of
 * importing this module: importing `resolver/rules.ts`, `resolver/
 * options.ts`, or the provider registry pulls in every provider manifest
 * (which reference `templatesRoot`-relative paths), and merely importing
 * that module graph must never touch the filesystem or throw — the
 * resolver is a deep module with a zero-I/O boundary. Walking the
 * filesystem (and potentially throwing if `templates/` can't be found)
 * only happens the first time `getTemplatesRoot()` is actually called,
 * i.e. when the scaffolder is about to resolve a real path.
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

let cachedTemplatesRoot: string | undefined;

/**
 * Resolves (and caches) the absolute path to `templates/`. Call this only
 * when actually about to read a fragment's files from disk — never at
 * module-load time.
 */
export function getTemplatesRoot(): string {
  if (cachedTemplatesRoot === undefined) {
    cachedTemplatesRoot = findTemplatesRoot();
  }
  return cachedTemplatesRoot;
}
