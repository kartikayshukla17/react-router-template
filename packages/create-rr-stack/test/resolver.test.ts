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

  const unresolvableCases: Array<{ name: string; selections: Selections }> = [
    { name: "postgres with no host at all", selections: { database: "postgres" } },
    {
      name: "postgres with an unsupported host",
      selections: { database: "postgres", postgresHost: "neon" },
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
    expect(options("orm", {})).toEqual([]);
    expect(options("auth", {})).toEqual([]);
    expect(options("storage", {})).toEqual([]);
    expect(options("realtime", {})).toEqual([]);
  });
});
