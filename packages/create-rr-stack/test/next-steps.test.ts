import { describe, expect, it, vi } from "vitest";

const noteSpy = vi.fn();
vi.mock("@clack/prompts", () => ({
  note: (...args: unknown[]) => noteSpy(...args),
}));

import { printNextSteps } from "../src/cli/next-steps.js";
import { resolve } from "../src/resolver/resolve.js";
import { isErrors, type Plan } from "../src/resolver/types.js";

/**
 * Covers the task-006 post-review fix: whether "nothing to configure" is
 * printed must be a property of the *whole resolved plan's* `env` array
 * (every selected provider across every layer), never a single provider's
 * own hardcoded `nextSteps` string. Before this fix, SQLite's provider
 * unconditionally printed "nothing to configure" even when Better Auth
 * (selected alongside it) still required BETTER_AUTH_SECRET/URL — a
 * self-contradictory checklist.
 */
describe("printNextSteps", () => {
  it("prints the generic 'nothing to configure' message for SQLite + Drizzle with no auth selected", () => {
    noteSpy.mockClear();
    const result = resolve({ database: "sqlite", orm: "drizzle" });
    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.env).toEqual([]);

    printNextSteps(plan, "my-app");

    expect(noteSpy).toHaveBeenCalledTimes(1);
    const printed = noteSpy.mock.calls[0]?.[0] as string;
    expect(printed).toContain("Nothing to configure — just run `npm run dev`.");
    expect(printed).not.toContain("Fill in these environment variables");
    expect(printed).not.toContain("BETTER_AUTH_SECRET");
  });

  it("prints the normal per-provider checklist (including BETTER_AUTH_SECRET) for SQLite + Drizzle + Better Auth, with no contradictory 'nothing to configure' line", () => {
    noteSpy.mockClear();
    const result = resolve({ database: "sqlite", orm: "drizzle", auth: "better-auth" });
    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.env.length).toBeGreaterThan(0);
    expect(plan.env.map((e) => e.name)).toContain("BETTER_AUTH_SECRET");

    printNextSteps(plan, "my-app");

    expect(noteSpy).toHaveBeenCalledTimes(1);
    const printed = noteSpy.mock.calls[0]?.[0] as string;
    expect(printed).toContain("Fill in these environment variables");
    expect(printed).toContain("BETTER_AUTH_SECRET");
    expect(printed).not.toContain("Nothing to configure — just run `npm run dev`.");
  });

  it("prints the normal checklist unchanged for a Postgres (Docker) combo", () => {
    noteSpy.mockClear();
    const result = resolve({
      database: "postgres",
      postgresHost: "docker",
      orm: "drizzle",
      auth: "better-auth",
    });
    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.env.length).toBeGreaterThan(0);

    printNextSteps(plan, "my-app");

    expect(noteSpy).toHaveBeenCalledTimes(1);
    const printed = noteSpy.mock.calls[0]?.[0] as string;
    expect(printed).toContain("Fill in these environment variables");
    expect(printed).toContain("DATABASE_URL");
    expect(printed).toContain("BETTER_AUTH_SECRET");
    expect(printed).toContain("Run `docker compose up -d`");
    expect(printed).not.toContain("Nothing to configure — just run `npm run dev`.");
  });
});
