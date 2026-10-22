import { describe, expect, it } from "vitest";
import { checkNodeVersion, MIN_NODE_VERSION } from "../src/node-guard.js";

describe("checkNodeVersion", () => {
  it("rejects a version below the floor", () => {
    const result = checkNodeVersion("v22.21.9");

    expect(result.ok).toBe(false);
    expect(result.message).toContain(MIN_NODE_VERSION);
    expect(result.message).toContain("22.21.9");
  });

  it("accepts a version exactly at the floor", () => {
    const result = checkNodeVersion("v22.22.0");

    expect(result.ok).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("accepts a version above the floor", () => {
    const result = checkNodeVersion("v23.0.0");

    expect(result.ok).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("rejects an unparseable version string", () => {
    const result = checkNodeVersion("not-a-version");

    expect(result.ok).toBe(false);
    expect(result.message).toContain("not-a-version");
    expect(result.message?.toLowerCase()).toContain("unable to parse");
  });

  it("includes upgrade hints for fnm, nvm and brew when below the floor", () => {
    const result = checkNodeVersion("v18.0.0");

    expect(result.message).toContain("fnm");
    expect(result.message).toContain("nvm");
    expect(result.message).toContain("brew");
  });
});
