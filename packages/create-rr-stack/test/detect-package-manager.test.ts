import { describe, expect, it } from "vitest";
import { detectPackageManager, installCommandFor } from "../src/cli/detect-package-manager.js";

describe("detectPackageManager (ticket 016)", () => {
  it.each([
    ["npm", "npm/10.9.2 node/v22.17.0 darwin x64 workspaces/false"],
    ["pnpm", "pnpm/9.12.1 npm/? node/v22.17.0 darwin x64"],
    ["yarn", "yarn/4.5.0 npm/? node/v22.17.0 darwin x64"],
    ["bun", "bun/1.1.30 npm/? node/v22.17.0 darwin x64"],
  ] as const)("detects %s from npm_config_user_agent", (expected, userAgent) => {
    expect(detectPackageManager({ npm_config_user_agent: userAgent })).toBe(expected);
  });

  it("falls back to npm when npm_config_user_agent is unset", () => {
    expect(detectPackageManager({})).toBe("npm");
  });

  it("falls back to npm for an unrecognized user agent string", () => {
    expect(detectPackageManager({ npm_config_user_agent: "deno/2.0.0 node/v22.17.0" })).toBe("npm");
  });
});

describe("installCommandFor (ticket 016)", () => {
  it.each([
    ["npm", ["npm", ["install"]]],
    ["pnpm", ["pnpm", ["install"]]],
    ["yarn", ["yarn", ["install"]]],
    ["bun", ["bun", ["install"]]],
  ] as const)("returns the right install command for %s", (pm, [command, args]) => {
    expect(installCommandFor(pm)).toEqual({ command, args });
  });
});
