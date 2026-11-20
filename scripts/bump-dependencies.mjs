#!/usr/bin/env node
/**
 * Ticket 018's weekly bump: resolves "latest" on npm for every pinned
 * dependency across every provider/glue manifest (`packages/create-rr-
 * stack/src/providers/**`), rewrites the version strings in place when
 * newer, and writes a markdown summary + `GITHUB_OUTPUT` values the
 * workflow uses to decide whether to push a branch at all.
 *
 * Deliberately scoped to `deps`/`devDeps` *blocks* specifically (matched
 * first, then package/version pairs extracted only from inside that
 * slice) rather than a single global regex over the whole file — these
 * manifests are TypeScript, not JSON, so nothing stops some unrelated
 * quoted string elsewhere in a provider file from looking like
 * `"name": "1.2.3"`; scoping to the `deps: { ... }`/`devDeps: { ... }`
 * block's own text first is what makes that impossible, not the
 * package/version pattern's precision.
 *
 * No semver range parsing beyond bare `MAJOR.MINOR.PATCH` (what every
 * provider manifest in this repo actually pins, always behind a leading
 * `^`) — this script's own regex is deliberately as narrow as what it
 * needs to handle today, not a general-purpose semver library.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const PROVIDERS_ROOT = path.join(REPO_ROOT, "packages/create-rr-stack/src/providers");
const SUMMARY_PATH = path.join(REPO_ROOT, "dependency-bump-summary.md");

const DEPS_BLOCK_PATTERN = /\b(deps|devDeps):\s*\{([^}]*)\}/g;
const PACKAGE_VERSION_PATTERN = /(?:"([^"]+)"|([\w$][\w$.-]*)):\s*"(\^?)(\d+)\.(\d+)\.(\d+)"/g;

async function listTsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsFiles(full)));
    } else if (entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const latestVersionCache = new Map();

/**
 * Returns `null` (not the registry's raw string) when the `latest`
 * dist-tag itself points at a prerelease — observed for real against the
 * live registry while building this script (`prisma`'s `latest` resolved
 * to `8.0.0-rc.34`). A dependency bump should never move a generated
 * project onto a release candidate just because a maintainer's `latest`
 * tag briefly points there.
 */
async function latestVersion(packageName) {
  if (latestVersionCache.has(packageName)) {
    return latestVersionCache.get(packageName);
  }
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} resolving ${packageName}`);
  }
  const data = await response.json();
  const version = STABLE_VERSION_PATTERN.test(data.version) ? data.version : null;
  latestVersionCache.set(packageName, version);
  return version;
}

function isNewer(current, latest) {
  const c = current.split(".").map(Number);
  const l = latest.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) !== (c[i] ?? 0)) {
      return (l[i] ?? 0) > (c[i] ?? 0);
    }
  }
  return false;
}

/** Applies every bumpable package/version pair found in one deps/devDeps block's text. */
async function bumpBlock(blockText, relativeFile, changes, errors) {
  let updated = blockText;

  for (const match of [...blockText.matchAll(PACKAGE_VERSION_PATTERN)]) {
    const [full, quotedName, bareName, caret, major, minor, patch] = match;
    const name = quotedName ?? bareName;
    const current = `${major}.${minor}.${patch}`;

    let latest;
    try {
      latest = await latestVersion(name);
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (latest === null) {
      continue;
    }

    if (isNewer(current, latest)) {
      const replacement = full.replace(`${caret}${current}`, `${caret}${latest}`);
      updated = updated.replace(full, replacement);
      changes.push({ package: name, file: relativeFile, from: current, to: latest });
    }
  }

  return updated;
}

async function bumpFile(filePath, changes, errors) {
  const content = await readFile(filePath, "utf8");
  const relativeFile = path.relative(REPO_ROOT, filePath);

  let updated = content;
  for (const match of [...content.matchAll(DEPS_BLOCK_PATTERN)]) {
    const [fullBlock, , innerText] = match;
    const updatedInner = await bumpBlock(innerText, relativeFile, changes, errors);
    if (updatedInner !== innerText) {
      updated = updated.replace(fullBlock, fullBlock.replace(innerText, updatedInner));
    }
  }

  if (updated !== content) {
    await writeFile(filePath, updated, "utf8");
  }
}

function formatSummary(changes, errors) {
  const lines = ["## Dependency bump summary", ""];

  if (changes.length === 0) {
    lines.push("No dependency updates found.");
  } else {
    lines.push("| Package | File | Old | New |", "| --- | --- | --- | --- |");
    for (const change of changes) {
      lines.push(`| ${change.package} | ${change.file} | ${change.from} | ${change.to} |`);
    }
  }

  if (errors.length > 0) {
    lines.push("", "### Couldn't resolve a latest version for", "");
    for (const error of errors) {
      lines.push(`- ${error}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function writeGithubOutput(changed, branch) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }
  await writeFile(outputPath, `changed=${changed}\nbranch=${branch}\n`, { flag: "a" });
}

async function main() {
  const files = await listTsFiles(PROVIDERS_ROOT);
  const changes = [];
  const errors = [];

  for (const file of files) {
    await bumpFile(file, changes, errors);
  }

  const summary = formatSummary(changes, errors);
  await writeFile(SUMMARY_PATH, summary, "utf8");
  console.log(summary);

  const changed = changes.length > 0;
  const branch = `deps/weekly-bump-${new Date().toISOString().slice(0, 10)}`;
  await writeGithubOutput(changed, branch);

  if (errors.length > 0 && changes.length === 0) {
    process.exitCode = 1;
  }
}

await main();
