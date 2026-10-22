import type { FileSystem } from "../types.js";

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/\/+/g, "/");
}

/**
 * An in-memory `FileSystem` for tests: no disk I/O, fully synchronous under
 * the hood (wrapped in resolved Promises to satisfy the async interface).
 */
export class MemoryFileSystem implements FileSystem {
  private readonly files = new Map<string, string>();

  constructor(seed: Record<string, string> = {}) {
    for (const [filePath, content] of Object.entries(seed)) {
      this.files.set(normalize(filePath), content);
    }
  }

  async readFile(filePath: string): Promise<string | undefined> {
    return this.files.get(normalize(filePath));
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.files.set(normalize(filePath), content);
  }

  // Directories are implicit in this in-memory model; nothing to create.
  async mkdir(_path: string): Promise<void> {}

  async exists(filePath: string): Promise<boolean> {
    return this.files.has(normalize(filePath));
  }

  /** Test helper: a snapshot of every path currently written, for assertions. */
  snapshot(): ReadonlyMap<string, string> {
    return new Map(this.files);
  }
}
