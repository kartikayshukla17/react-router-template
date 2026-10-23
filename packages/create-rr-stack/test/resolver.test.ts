import { describe, expect, it } from "vitest";
import { options } from "../src/resolver/options.js";
import { resolve } from "../src/resolver/resolve.js";
import { isErrors, type Plan, type Selections } from "../src/resolver/types.js";

describe("resolve", () => {
  it("returns an empty, valid Plan for an empty selection", () => {
    const result = resolve({});

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers).toEqual([]);
    expect(plan.glue).toEqual([]);
    expect(plan.installOrder).toEqual([]);
    expect(plan.env).toEqual([]);
    expect(plan.nextSteps).toEqual([]);
  });

  it("resolves postgres+docker to exactly the postgres-docker provider", () => {
    const result = resolve({ database: "postgres", postgresHost: "docker" });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers).toHaveLength(1);
    expect(plan.providers[0]?.id).toBe("postgres-docker");
    expect(plan.providers[0]?.layer).toBe("database");
    expect(plan.installOrder).toEqual(["postgres-docker"]);
  });

  it("resolves postgres+neon to exactly the postgres-neon provider", () => {
    const result = resolve({ database: "postgres", postgresHost: "neon" });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers).toHaveLength(1);
    expect(plan.providers[0]?.id).toBe("postgres-neon");
    expect(plan.providers[0]?.layer).toBe("database");
    expect(plan.installOrder).toEqual(["postgres-neon"]);
  });

  it("resolves the full Neon + Drizzle + Better Auth combination to three providers and one glue fragment", () => {
    const result = resolve({
      database: "postgres",
      postgresHost: "neon",
      orm: "drizzle",
      auth: "better-auth",
    });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers.map((p) => p.id).sort()).toEqual(
      ["better-auth", "drizzle", "postgres-neon"].sort(),
    );
    expect(plan.glue).toHaveLength(1);
    expect(plan.glue[0]?.between).toEqual(["drizzle", "better-auth"]);
  });

  it("rejects drizzle without a Neon-hosted postgres database", () => {
    const result = resolve({ database: "postgres", postgresHost: "docker", orm: "drizzle" });
    expect(isErrors(result)).toBe(true);
  });

  it("rejects better-auth without drizzle + postgres", () => {
    const result = resolve({ auth: "better-auth" });
    expect(isErrors(result)).toBe(true);
  });

  const unresolvableCases: Array<{ name: string; selections: Selections }> = [
    { name: "postgres with no host at all", selections: { database: "postgres" } },
    {
      name: "postgres with an unsupported host",
      selections: { database: "postgres", postgresHost: "supabase" },
    },
  ];

  it.each(unresolvableCases)(
    "returns a typed Errors value, not a throw, for: $name",
    ({ selections }) => {
      let result: ReturnType<typeof resolve> | undefined;

      expect(() => {
        result = resolve(selections);
      }).not.toThrow();

      expect(result).toBeDefined();
      expect(isErrors(result as NonNullable<typeof result>)).toBe(true);
      const errors = result as { errors: unknown[] };
      expect(errors.errors.length).toBeGreaterThan(0);
    },
  );

  it("never throws regardless of input", () => {
    expect(() => resolve({ database: "postgres", postgresHost: "supabase" })).not.toThrow();
    expect(() => resolve({ database: "sqlite" })).not.toThrow();
  });
});

describe("options", () => {
  it("lists postgres as a database option", () => {
    const result = options("database", {});
    expect(result).toEqual([{ value: "postgres", label: "PostgreSQL" }]);
  });

  it("returns an empty list for layers with no registered providers yet", () => {
    expect(options("storage", {})).toEqual([]);
    expect(options("realtime", {})).toEqual([]);
  });

  it("lists drizzle as an orm option, disabled with a reason until database is postgres", () => {
    expect(options("orm", {})).toEqual([
      {
        value: "drizzle",
        label: "Drizzle",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
    ]);
    expect(options("orm", { database: "postgres" })).toEqual([
      { value: "drizzle", label: "Drizzle" },
    ]);
  });

  it("lists better-auth as an auth option, disabled until orm is drizzle and database is postgres", () => {
    const disabled = options("auth", {});
    expect(disabled).toHaveLength(1);
    expect(disabled[0]?.disabled).toBe(true);

    expect(options("auth", { database: "postgres", orm: "drizzle" })).toEqual([
      { value: "better-auth", label: "Better Auth" },
    ]);
  });

  it("disables drizzle when the postgres host is docker, since no non-Neon driver fragment exists yet", () => {
    const result = options("orm", { database: "postgres", postgresHost: "docker" });

    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe("drizzle");
    expect(result[0]?.disabled).toBe(true);
    expect(result[0]?.reason).toContain("neon");
  });

  it("still offers drizzle for the Neon host", () => {
    expect(options("orm", { database: "postgres", postgresHost: "neon" })).toEqual([
      { value: "drizzle", label: "Drizzle" },
    ]);
  });
});
