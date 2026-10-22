import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileSystem } from "../types.js";

function isNodeErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function isNotFound(error: unknown): boolean {
  return isNodeErrnoException(error) && error.code === "ENOENT";
}

/**
 * The production `FileSystem`: real disk I/O via `node:fs/promises`.
 * Not exercised by the resolver/scaffolder test suite (those run entirely
 * against `MemoryFileSystem`) — this adapter is the thin seam the CLI shell
 * (a later ticket) wires in for an actual run.
 */
export class NodeFileSystem implements FileSystem {
  async readFile(filePath: string): Promise<string | undefined> {
    try {
      return await readFile(filePath, "utf8");
    } catch (error) {
      if (isNotFound(error)) {
        return undefined;
      }
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }

  async mkdir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch (error) {
      if (isNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
}
