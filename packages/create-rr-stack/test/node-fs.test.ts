import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NodeFileSystem } from "../src/scaffolder/fs/node-fs.js";

/**
 * Adapter test for the real-disk `FileSystem` implementation. The
 * resolver/scaffolder business-logic tests are scoped to zero disk I/O
 * (they run against `MemoryFileSystem`), but this is the small,
 * separately-scoped exercise of `NodeFileSystem` itself against a real,
 * cleaned-up temp directory.
 */
describe("NodeFileSystem", () => {
  let tempDir: string;
  let fs: NodeFileSystem;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "create-rr-stack-node-fs-"));
    fs = new NodeFileSystem();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("reports a file as not existing before it is written", async () => {
    const filePath = path.join(tempDir, "nested", "dir", "file.txt");
    expect(await fs.exists(filePath)).toBe(false);
  });

  it("returns undefined from readFile for a path that does not exist (ENOENT)", async () => {
    const filePath = path.join(tempDir, "missing.txt");
    expect(await fs.readFile(filePath)).toBeUndefined();
  });

  it("writeFile creates missing parent directories recursively before writing", async () => {
    const filePath = path.join(tempDir, "a", "b", "c", "file.txt");

    await fs.writeFile(filePath, "hello world");

    expect(await fs.readFile(filePath)).toBe("hello world");
  });

  it("exists returns true once a file has been written", async () => {
    const filePath = path.join(tempDir, "exists.txt");
    expect(await fs.exists(filePath)).toBe(false);

    await fs.writeFile(filePath, "content");

    expect(await fs.exists(filePath)).toBe(true);
  });

  it("mkdir creates a directory recursively, including intermediate segments", async () => {
    const dirPath = path.join(tempDir, "x", "y", "z");

    await fs.mkdir(dirPath);

    expect(await fs.exists(dirPath)).toBe(true);
  });

  it("overwrites existing file content on a second writeFile to the same path", async () => {
    const filePath = path.join(tempDir, "overwrite.txt");

    await fs.writeFile(filePath, "first");
    await fs.writeFile(filePath, "second");

    expect(await fs.readFile(filePath)).toBe("second");
  });

  it("mkdir is idempotent when the directory already exists", async () => {
    const dirPath = path.join(tempDir, "already-there");

    await fs.mkdir(dirPath);
    await expect(fs.mkdir(dirPath)).resolves.toBeUndefined();
  });
});
