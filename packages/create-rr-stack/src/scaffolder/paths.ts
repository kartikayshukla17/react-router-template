import path from "node:path";

/**
 * Joins path segments using forward slashes, regardless of host OS.
 *
 * The scaffolder deals in *logical* paths (plan-relative output paths, the
 * in-memory fs's keys). Using `path.posix.join` for these keeps behaviour
 * identical on Windows and POSIX — a real `path.join` would otherwise use
 * `\` as the separator on Windows, which the in-memory adapter doesn't
 * special-case and which `node:fs` APIs accept but normalize differently
 * than a hand-built POSIX string. Segments are normalized to `/` first so a
 * segment copy-pasted from a Windows path still joins correctly.
 */
export function joinPath(...segments: string[]): string {
  const posixSegments = segments.map((segment) => segment.split(path.sep).join("/"));
  return path.posix.join(...posixSegments);
}

export function dirnamePath(filePath: string): string {
  return path.posix.dirname(filePath);
}
