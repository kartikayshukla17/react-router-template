/**
 * The scaffolder's injectable filesystem seam. Both the real-fs adapter and
 * the in-memory adapter (used by every scaffolder test) implement this same
 * shape, so `scaffold()` never knows or cares which one it's talking to.
 *
 * Deliberately narrow: no directory listing. Provider manifests declare
 * their own `fileManifest` (see resolver/types.ts) instead of the scaffolder
 * discovering files by walking a folder.
 */
export interface FileSystem {
  /** Resolves to the file's contents, or `undefined` if it doesn't exist. */
  readFile(path: string): Promise<string | undefined>;
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

export type ScaffoldErrorCode = "PATH_COLLISION" | "MISSING_FRAGMENT_FILE";

export interface ScaffoldError {
  code: ScaffoldErrorCode;
  message: string;
  path?: string;
  /** Present for PATH_COLLISION: the two provider ids that both claim `path`. */
  fragments?: [string, string];
}

export type ScaffoldResult =
  | { ok: true; writtenPaths: string[] }
  | { ok: false; error: ScaffoldError };
