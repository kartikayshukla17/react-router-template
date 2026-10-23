import { describe, expect, it } from "vitest";
import { options } from "../src/resolver/options.js";
import { resolve, selectBaasClients } from "../src/resolver/resolve.js";
import {
  type Constraint,
  isErrors,
  type Plan,
  type Provider,
  type Selections,
} from "../src/resolver/types.js";

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

  it("resolves the full Neon + Drizzle + Better Auth combination to three providers and three glue fragments", () => {
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
    expect(plan.glue.map((g) => g.between).sort()).toEqual(
      [
        ["better-auth", "postgres"],
        ["drizzle", "better-auth"],
        ["drizzle", "postgres-neon"],
      ].sort(),
    );
  });

  it("resolves the full Docker + Drizzle + Better Auth combination to three providers and three glue fragments", () => {
    const result = resolve({
      database: "postgres",
      postgresHost: "docker",
      orm: "drizzle",
      auth: "better-auth",
    });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers.map((p) => p.id).sort()).toEqual(
      ["better-auth", "drizzle", "postgres-docker"].sort(),
    );
    expect(plan.glue.map((g) => g.between).sort()).toEqual(
      [
        ["better-auth", "postgres"],
        ["drizzle", "better-auth"],
        ["drizzle", "postgres-docker"],
      ].sort(),
    );
  });

  it("resolves SQLite + Drizzle + Better Auth to three providers, three glue fragments, and zero database env vars", () => {
    const result = resolve({
      database: "sqlite",
      orm: "drizzle",
      auth: "better-auth",
    });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers.map((p) => p.id).sort()).toEqual(
      ["better-auth", "drizzle", "sqlite"].sort(),
    );
    expect(plan.glue.map((g) => g.between).sort()).toEqual(
      [
        ["better-auth", "sqlite"],
        ["drizzle", "better-auth"],
        ["drizzle", "sqlite"],
      ].sort(),
    );
    // No DATABASE_URL, no account signup — only whatever Better Auth itself
    // recommends (BETTER_AUTH_SECRET/URL), which is independent of which
    // database was chosen.
    expect(plan.env.map((e) => e.name)).not.toContain("DATABASE_URL");
  });

  it("resolves sqlite alone to exactly the sqlite provider, with no env vars", () => {
    const result = resolve({ database: "sqlite" });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers).toHaveLength(1);
    expect(plan.providers[0]?.id).toBe("sqlite");
    expect(plan.providers[0]?.layer).toBe("database");
    expect(plan.env).toEqual([]);
  });

  it("allows drizzle with a Docker-hosted postgres database", () => {
    const result = resolve({ database: "postgres", postgresHost: "docker", orm: "drizzle" });
    expect(isErrors(result)).toBe(false);
  });

  it("rejects better-auth without drizzle + postgres", () => {
    const result = resolve({ auth: "better-auth" });
    expect(isErrors(result)).toBe(true);
  });

  const unresolvableCases: Array<{ name: string; selections: Selections }> = [
    { name: "postgres with no host at all", selections: { database: "postgres" } },
    {
      name: "postgres with an unsupported host",
      selections: { database: "postgres", postgresHost: "cockroach" } as unknown as Selections,
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

  it("resolves postgres+supabase to the postgres-supabase provider plus the shared supabase-client fragment", () => {
    const result = resolve({ database: "postgres", postgresHost: "supabase" });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers.map((p) => p.id).sort()).toEqual(
      ["postgres-supabase", "supabase-client"].sort(),
    );

    const envNames = plan.env.map((e) => e.name).sort();
    expect(envNames).toEqual(["DATABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_URL"].sort());

    const clientProvider = plan.providers.find((p) => p.id === "supabase-client");
    expect(clientProvider?.deps["@supabase/supabase-js"]).toBeDefined();
  });

  it("resolves the full Supabase + Drizzle + Better Auth combination with the shared client included exactly once", () => {
    const result = resolve({
      database: "postgres",
      postgresHost: "supabase",
      orm: "drizzle",
      auth: "better-auth",
    });

    expect(isErrors(result)).toBe(false);
    const plan = result as Plan;
    expect(plan.providers.map((p) => p.id).sort()).toEqual(
      ["better-auth", "drizzle", "postgres-supabase", "supabase-client"].sort(),
    );
    expect(plan.providers.filter((p) => p.id === "supabase-client")).toHaveLength(1);
    expect(plan.glue.map((g) => g.between).sort()).toEqual(
      [
        ["better-auth", "postgres"],
        ["drizzle", "better-auth"],
        ["drizzle", "postgres-supabase"],
      ].sort(),
    );
  });

  describe("selectBaasClients (BaaS shared-client dedup)", () => {
    /**
     * Ticket 005's core new mechanism: whichever and however many selected
     * providers declare `baas: "supabase"`, the shared supabase-client
     * fragment must appear exactly once in the resulting plan. Tickets
     * 010/014/015 haven't landed yet, so there's no second *real* provider
     * in the registry that also declares `baas: "supabase"` — this test
     * proves the dedup rule itself, ahead of that, with a throwaway stub
     * provider constructed only here (never added to
     * `providers/registry.ts`).
     */
    it("includes the shared supabase-client fragment exactly once, even with two independent baas:supabase providers", () => {
      const supabaseDatabaseProvider = (
        resolve({
          database: "postgres",
          postgresHost: "supabase",
        }) as Plan
      ).providers.find((p) => p.id === "postgres-supabase");
      expect(supabaseDatabaseProvider).toBeDefined();

      // Stand-in for a future layer (e.g. ticket 010's Supabase Auth
      // provider) that also needs the shared Supabase client. Local to this
      // test only.
      const stubSupabaseAuthProvider: Provider = {
        layer: "auth",
        id: "stub-supabase-auth",
        label: "Stub Supabase Auth (test-only)",
        baas: "supabase",
        deps: {},
        env: [],
        files: "providers/auth/stub-supabase-auth",
        fileManifest: [],
        nextSteps: [],
      };

      const clients = selectBaasClients([
        supabaseDatabaseProvider as Provider,
        stubSupabaseAuthProvider,
      ]);

      expect(clients).toHaveLength(1);
      expect(clients[0]?.id).toBe("supabase-client");
    });

    it("includes nothing when no selected provider declares a baas", () => {
      const dockerProvider = (
        resolve({
          database: "postgres",
          postgresHost: "docker",
        }) as Plan
      ).providers.find((p) => p.id === "postgres-docker");

      expect(selectBaasClients([dockerProvider as Provider])).toEqual([]);
    });

    /**
     * Post-review fix (Important finding 2): `"baas"` must not be a
     * selectable layer. These two assignments are compile errors with the
     * narrowed `SelectableLayer`/`Selections` types — `@ts-expect-error`
     * makes that a checked fact (caught by `tsc --noEmit`, not just this
     * test's runtime assertion, which only confirms the lines are
     * reachable at all).
     */
    it("rejects selections.baas and a baas Constraint at the type level", () => {
      const selections: Selections = {};
      // @ts-expect-error — Selections has no "baas" field; it was removed
      // so this can never silently compile to a no-op.
      selections.baas = "supabase";

      const badConstraint: Constraint = {
        // @ts-expect-error — Constraint.layer is SelectableLayer, which
        // excludes "baas"; a constraint naming it would always fail
        // silently with a confusing message instead of failing to compile.
        layer: "baas",
        oneOf: ["supabase"],
      };

      expect(badConstraint.oneOf).toEqual(["supabase"]);
    });
  });
});

describe("options", () => {
  it("lists postgres and sqlite as database options", () => {
    const result = options("database", {});
    expect(result).toEqual([
      { value: "postgres", label: "PostgreSQL" },
      { value: "sqlite", label: "SQLite (local file)" },
    ]);
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

  it("offers drizzle for the Docker host, now that it has a real driver fragment", () => {
    expect(options("orm", { database: "postgres", postgresHost: "docker" })).toEqual([
      { value: "drizzle", label: "Drizzle" },
    ]);
  });

  it("still offers drizzle for the Neon host", () => {
    expect(options("orm", { database: "postgres", postgresHost: "neon" })).toEqual([
      { value: "drizzle", label: "Drizzle" },
    ]);
  });

  it("offers drizzle for the Supabase host, now that it has a real driver fragment", () => {
    expect(options("orm", { database: "postgres", postgresHost: "supabase" })).toEqual([
      { value: "drizzle", label: "Drizzle" },
    ]);
  });

  it("offers drizzle for sqlite — no host-driver concern applies there", () => {
    expect(options("orm", { database: "sqlite" })).toEqual([
      { value: "drizzle", label: "Drizzle" },
    ]);
  });

  it("offers better-auth once database is sqlite and orm is drizzle", () => {
    expect(options("auth", { database: "sqlite", orm: "drizzle" })).toEqual([
      { value: "better-auth", label: "Better Auth" },
    ]);
  });

  it("disables drizzle for a future unsupported host", () => {
    const result = options("orm", {
      database: "postgres",
      postgresHost: "cockroach",
    } as unknown as Selections);

    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe("drizzle");
    expect(result[0]?.disabled).toBe(true);
    expect(result[0]?.reason).toContain("neon, docker, supabase");
  });
});
