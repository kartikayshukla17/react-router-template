#!/usr/bin/env node
/**
 * Ticket 019's publish-readiness fix: `templates/` has to travel inside
 * the published package, or `npx create-rr-stack` breaks the moment it's
 * installed outside this monorepo — `providers/templates-root.ts`'s
 * `getTemplatesRoot()` only ever finds a `templates/` directory that's
 * actually on disk somewhere above it; it doesn't invent one.
 *
 * Runs as a build step (`tsdown && node scripts/copy-templates.mjs`),
 * after tsdown's own `clean: true` wipe, copying the repo's real
 * `templates/` into `dist/templates/` — a sibling of the bundled `dist/
 * cli.mjs`. `getTemplatesRoot()`'s upward walk needs no change at all for
 * this: once tsdown inlines every provider manifest into one `dist/
 * cli.mjs` file, `import.meta.url` inside that bundle resolves to `dist/
 * cli.mjs` itself, so the walk's very first check — a `templates/`
 * sibling of this file — finds `dist/templates/` immediately, the same
 * way it already finds the repo-root `templates/` when running
 * unbundled from `src/`. `package.json`'s `files: ["dist"]` ships
 * whatever's under `dist/` recursively, `dist/templates/` included —
 * nothing else to configure there either.
 */
import { cp } from "node:fs/promises";
import path from "node:path";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
const SOURCE = path.join(REPO_ROOT, "templates");
const DEST = path.join(PACKAGE_ROOT, "dist", "templates");

await cp(SOURCE, DEST, { recursive: true });
console.log(`Copied ${path.relative(REPO_ROOT, SOURCE)} -> ${path.relative(REPO_ROOT, DEST)}`);
