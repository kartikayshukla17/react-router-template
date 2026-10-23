import os from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression coverage for the "resolver does I/O as a module-load side
 * effect" review finding: `templates-root.ts` used to run an `existsSync`
 * walk (and could throw) the moment it was imported, and every provider
 * manifest imported it — so merely importing the resolver module graph
 * (`resolver/rules.ts`, `resolver/options.ts`, the provider registry) did
 * disk I/O and depended on where the checkout sits on disk. `getTemplatesRoot`
 * is now lazy/memoized: importing those modules must do zero filesystem
 * access, and the real resolution only happens the first time
 * `getTemplatesRoot()` is actually called.
 */

const { existsSyncSpy } = vi.hoisted(() => ({ existsSyncSpy: vi.fn() }));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: (...args: Parameters<typeof actual.existsSync>) => {
      existsSyncSpy(...args);
      return actual.existsSync(...args);
    },
  };
});

describe("templates root resolution stays lazy", () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    existsSyncSpy.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("does not call existsSync merely by importing resolver/provider modules", async () => {
    await import("../src/resolver/rules.js");
    await import("../src/resolver/options.js");
    await import("../src/providers/registry.js");

    expect(existsSyncSpy).not.toHaveBeenCalled();
  });

  it("never throws while importing, regardless of process.cwd()", async () => {
    process.chdir(os.tmpdir());

    await expect(import("../src/resolver/rules.js")).resolves.toBeDefined();
    await expect(import("../src/resolver/options.js")).resolves.toBeDefined();
    await expect(import("../src/providers/registry.js")).resolves.toBeDefined();
    expect(existsSyncSpy).not.toHaveBeenCalled();
  });

  it("only touches the filesystem once getTemplatesRoot() is actually called", async () => {
    const { getTemplatesRoot } = await import("../src/providers/templates-root.js");
    expect(existsSyncSpy).not.toHaveBeenCalled();

    const root = getTemplatesRoot();
    expect(root).toContain("templates");
    expect(existsSyncSpy).toHaveBeenCalled();
  });
});
