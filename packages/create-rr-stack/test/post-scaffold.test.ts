import { describe, expect, it, vi } from "vitest";
import { initGit, installDependencies } from "../src/cli/post-scaffold.js";
import type { CommandRunner } from "../src/cli/run-command.js";

describe("initGit (ticket 016)", () => {
  it("runs `git init` in the target directory and reports success", async () => {
    const runner: CommandRunner = vi.fn().mockResolvedValue({ code: 0 });
    const ok = await initGit("/out", runner);
    expect(ok).toBe(true);
    expect(runner).toHaveBeenCalledWith("git", ["init"], "/out");
  });

  it("reports failure when `git init` exits non-zero", async () => {
    const runner: CommandRunner = vi.fn().mockResolvedValue({ code: 1 });
    const ok = await initGit("/out", runner);
    expect(ok).toBe(false);
  });
});

describe("installDependencies (ticket 016)", () => {
  it.each([
    ["npm", "npm", ["install"]],
    ["pnpm", "pnpm", ["install"]],
    ["yarn", "yarn", ["install"]],
    ["bun", "bun", ["install"]],
  ] as const)("runs the right install command for %s", async (pm, command, args) => {
    const runner: CommandRunner = vi.fn().mockResolvedValue({ code: 0 });
    const ok = await installDependencies("/out", pm, runner);
    expect(ok).toBe(true);
    expect(runner).toHaveBeenCalledWith(command, args, "/out");
  });

  it("reports failure when install exits non-zero", async () => {
    const runner: CommandRunner = vi.fn().mockResolvedValue({ code: 1 });
    const ok = await installDependencies("/out", "npm", runner);
    expect(ok).toBe(false);
  });
});
