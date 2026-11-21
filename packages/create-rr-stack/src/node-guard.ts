/**
 * Guards CLI startup against unsupported Node.js versions.
 *
 * This must be the first thing `cli.ts` calls, before any prompt or flag
 * parsing, so a user on an old Node install gets a clear upgrade message
 * instead of a cryptic failure deeper in the stack.
 */

export const MIN_NODE_VERSION = "22.22.0";

export interface NodeGuardResult {
  ok: boolean;
  /** Present only when `ok` is false. */
  message?: string;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)/;

function parseVersion(version: string): ParsedVersion | undefined {
  const match = VERSION_PATTERN.exec(version.trim());
  if (!match) {
    return undefined;
  }

  const [, major, minor, patch] = match;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
  };
}

function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function formatVersion(v: ParsedVersion): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

function upgradeHints(): string {
  return [
    "Upgrade Node.js, then re-run this command:",
    `  fnm:   fnm install ${MIN_NODE_VERSION} && fnm use ${MIN_NODE_VERSION}`,
    `  nvm:   nvm install ${MIN_NODE_VERSION} && nvm use ${MIN_NODE_VERSION}`,
    "  brew:  brew upgrade node",
  ].join("\n");
}

/**
 * Checks a Node.js version string (e.g. `process.version`) against the
 * minimum supported version. Returns `{ ok: true }` when the version meets
 * the floor, or `{ ok: false, message }` with a formatted explanation
 * otherwise — including when the version string can't be parsed at all.
 */
export function checkNodeVersion(version: string): NodeGuardResult {
  const parsed = parseVersion(version);

  if (!parsed) {
    return {
      ok: false,
      message: [
        `Unable to parse the current Node.js version ("${version}").`,
        `create-rrstack requires Node.js >= ${MIN_NODE_VERSION}.`,
        upgradeHints(),
      ].join("\n"),
    };
  }

  const floor = parseVersion(MIN_NODE_VERSION);
  if (!floor) {
    throw new Error(`MIN_NODE_VERSION ("${MIN_NODE_VERSION}") is not a valid version`);
  }

  if (compareVersions(parsed, floor) < 0) {
    return {
      ok: false,
      message: [
        `create-rrstack requires Node.js >= ${MIN_NODE_VERSION}, but found ${formatVersion(parsed)}.`,
        upgradeHints(),
      ].join("\n"),
    };
  }

  return { ok: true };
}
