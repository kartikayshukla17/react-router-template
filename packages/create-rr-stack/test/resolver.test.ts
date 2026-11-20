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

  describe("MongoDB + Mongoose (ticket 007)", () => {
    it("resolves mongodb+docker to exactly the mongodb-docker provider", () => {
      const result = resolve({ database: "mongodb", mongoHost: "docker" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers).toHaveLength(1);
      expect(plan.providers[0]?.id).toBe("mongodb-docker");
      expect(plan.providers[0]?.layer).toBe("database");
      expect(plan.env.map((e) => e.name)).toEqual(["MONGODB_URI"]);
    });

    it("resolves mongodb+hosted to exactly the mongodb-hosted provider", () => {
      const result = resolve({ database: "mongodb", mongoHost: "hosted" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers).toHaveLength(1);
      expect(plan.providers[0]?.id).toBe("mongodb-hosted");
    });

    it("rejects mongodb with no host, same as postgres with no host", () => {
      const result = resolve({ database: "mongodb" });
      expect(isErrors(result)).toBe(true);
    });

    it("rejects mongodb with an unsupported host", () => {
      const result = resolve({
        database: "mongodb",
        mongoHost: "cosmos",
      } as unknown as Selections);
      expect(isErrors(result)).toBe(true);
    });

    it("resolves the full Docker-Mongo + Mongoose + Better Auth combination to three providers and two glue fragments", () => {
      const result = resolve({
        database: "mongodb",
        mongoHost: "docker",
        orm: "mongoose",
        auth: "better-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["better-auth", "mongodb-docker", "mongoose"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual(
        [
          ["mongoose", "mongodb"],
          ["better-auth", "mongoose"],
        ].sort(),
      );
    });

    it("resolves the hosted-Mongo + Mongoose + Better Auth combination identically on the glue side", () => {
      const result = resolve({
        database: "mongodb",
        mongoHost: "hosted",
        orm: "mongoose",
        auth: "better-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["better-auth", "mongodb-hosted", "mongoose"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual(
        [
          ["mongoose", "mongodb"],
          ["better-auth", "mongoose"],
        ].sort(),
      );
    });

    it("rejects drizzle paired with mongodb", () => {
      const result = resolve({ database: "mongodb", mongoHost: "docker", orm: "drizzle" });
      expect(isErrors(result)).toBe(true);
    });

    it("rejects mongoose paired with postgres or sqlite", () => {
      expect(
        isErrors(resolve({ database: "postgres", postgresHost: "docker", orm: "mongoose" })),
      ).toBe(true);
      expect(isErrors(resolve({ database: "sqlite", orm: "mongoose" }))).toBe(true);
    });
  });

  describe("Prisma (ticket 008)", () => {
    it("resolves the full Neon + Prisma + Better Auth combination to three providers and three glue fragments", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "neon",
        orm: "prisma",
        auth: "better-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["better-auth", "prisma", "postgres-neon"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual(
        [
          ["prisma", "better-auth"],
          ["prisma", "postgres-neon"],
        ].sort(),
      );
    });

    it("resolves the full Docker + Prisma + Better Auth combination to three providers and three glue fragments", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "docker",
        orm: "prisma",
        auth: "better-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["better-auth", "prisma", "postgres-docker"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual(
        [
          ["prisma", "better-auth"],
          ["prisma", "postgres-docker"],
        ].sort(),
      );
    });

    it("resolves the full Supabase + Prisma + Better Auth combination to four providers (incl. the shared Supabase client)", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "supabase",
        orm: "prisma",
        auth: "better-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["better-auth", "prisma", "postgres-supabase", "supabase-client"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual(
        [
          ["prisma", "better-auth"],
          ["prisma", "postgres-supabase"],
        ].sort(),
      );
    });

    it("resolves SQLite + Prisma + Better Auth to three providers and two glue fragments, with zero database env vars", () => {
      const result = resolve({
        database: "sqlite",
        orm: "prisma",
        auth: "better-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["better-auth", "prisma", "sqlite"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual(
        [
          ["prisma", "better-auth"],
          ["prisma", "sqlite"],
        ].sort(),
      );
      expect(plan.env.map((e) => e.name)).not.toContain("DATABASE_URL");
    });

    it("allows prisma with a Docker-hosted postgres database", () => {
      const result = resolve({ database: "postgres", postgresHost: "docker", orm: "prisma" });
      expect(isErrors(result)).toBe(false);
    });

    it("rejects prisma paired with mongodb", () => {
      const result = resolve({ database: "mongodb", mongoHost: "docker", orm: "prisma" });
      expect(isErrors(result)).toBe(true);
    });

    it("switching drizzle<->prisma for the same database/host only changes the ORM and glue providers selected, not the database provider", () => {
      const withDrizzle = resolve({
        database: "postgres",
        postgresHost: "docker",
        orm: "drizzle",
        auth: "better-auth",
      }) as Plan;
      const withPrisma = resolve({
        database: "postgres",
        postgresHost: "docker",
        orm: "prisma",
        auth: "better-auth",
      }) as Plan;

      expect(withDrizzle.providers.find((p) => p.id === "postgres-docker")).toEqual(
        withPrisma.providers.find((p) => p.id === "postgres-docker"),
      );
      expect(withDrizzle.providers.map((p) => p.id).sort()).not.toEqual(
        withPrisma.providers.map((p) => p.id).sort(),
      );
    });
  });

  it("rejects better-auth without drizzle + postgres", () => {
    const result = resolve({ auth: "better-auth" });
    expect(isErrors(result)).toBe(true);
  });

  describe("Clerk (ticket 009)", () => {
    it("resolves clerk alone, with no database or ORM, to exactly the clerk provider and no glue", () => {
      const result = resolve({ auth: "clerk" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id)).toEqual(["clerk"]);
      expect(plan.glue).toEqual([]);
    });

    it("resolves clerk alongside Postgres + Drizzle with no auth-ORM glue fragment added", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "docker",
        orm: "drizzle",
        auth: "clerk",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["clerk", "drizzle", "postgres-docker"].sort(),
      );
      // Only the ORM+host driver glue is present — nothing pairs clerk with drizzle.
      expect(plan.glue.map((g) => g.between).sort()).toEqual([["drizzle", "postgres-docker"]]);
    });

    it("resolves clerk alongside MongoDB + Mongoose with no auth-ORM glue fragment added", () => {
      const result = resolve({
        database: "mongodb",
        mongoHost: "docker",
        orm: "mongoose",
        auth: "clerk",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["clerk", "mongodb-docker", "mongoose"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual([["mongoose", "mongodb"]]);
    });

    it("has no requires/conflicts, so it never rejects a combination on its own account", () => {
      const clerkProvider = (resolve({ auth: "clerk" }) as Plan).providers[0];
      expect(clerkProvider?.requires ?? []).toEqual([]);
      expect(clerkProvider?.conflicts ?? []).toEqual([]);
    });
  });

  describe("Supabase Auth (ticket 010)", () => {
    it("resolves supabase-auth alone, with no database, to the auth provider plus the shared Supabase client", () => {
      const result = resolve({ auth: "supabase-auth" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["supabase-auth", "supabase-client"].sort(),
      );
      expect(plan.glue).toEqual([]);
    });

    it("resolves the literal cross-layer-mixing example: Supabase Auth + Neon Postgres + Drizzle", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "neon",
        orm: "drizzle",
        auth: "supabase-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["drizzle", "postgres-neon", "supabase-auth", "supabase-client"].sort(),
      );
      // Only the ORM+host driver glue — nothing pairs supabase-auth with drizzle.
      expect(plan.glue.map((g) => g.between).sort()).toEqual([["drizzle", "postgres-neon"]]);
    });

    it("resolves supabase-auth + SQLite (no Supabase database at all) to the auth provider, sqlite, drizzle, and still exactly one shared client", () => {
      const result = resolve({ database: "sqlite", orm: "drizzle", auth: "supabase-auth" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.filter((p) => p.id === "supabase-client")).toHaveLength(1);
    });

    it("shares exactly one supabase-client fragment between the Supabase Postgres host and Supabase Auth, not two", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "supabase",
        orm: "drizzle",
        auth: "supabase-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.filter((p) => p.id === "supabase-client")).toHaveLength(1);
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["drizzle", "postgres-supabase", "supabase-auth", "supabase-client"].sort(),
      );
    });

    it("has no requires/conflicts, so it never rejects a combination on its own account", () => {
      const provider = (resolve({ auth: "supabase-auth" }) as Plan).providers.find(
        (p) => p.id === "supabase-auth",
      );
      expect(provider?.requires ?? []).toEqual([]);
      expect(provider?.conflicts ?? []).toEqual([]);
    });
  });

  describe("Firebase Auth (ticket 011)", () => {
    it("resolves firebase-auth alone, with no database, to the auth provider plus the shared Firebase client", () => {
      const result = resolve({ auth: "firebase-auth" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["firebase-auth", "firebase-client"].sort(),
      );
      expect(plan.glue).toEqual([]);
    });

    it("resolves Firebase Auth + Neon Postgres + Drizzle — the exact combination asked about in grilling round 3", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "neon",
        orm: "drizzle",
        auth: "firebase-auth",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["drizzle", "firebase-auth", "firebase-client", "postgres-neon"].sort(),
      );
      expect(plan.glue.map((g) => g.between).sort()).toEqual([["drizzle", "postgres-neon"]]);
    });

    it("resolves Firebase Auth + SQLite to the auth provider, sqlite, drizzle, and exactly one shared client", () => {
      const result = resolve({ database: "sqlite", orm: "drizzle", auth: "firebase-auth" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.filter((p) => p.id === "firebase-client")).toHaveLength(1);
    });

    it("has no requires/conflicts, so it never rejects a combination on its own account", () => {
      const provider = (resolve({ auth: "firebase-auth" }) as Plan).providers.find(
        (p) => p.id === "firebase-auth",
      );
      expect(provider?.requires ?? []).toEqual([]);
      expect(provider?.conflicts ?? []).toEqual([]);
    });
  });

  describe("Convex bundle (ticket 012)", () => {
    it("resolves database: convex alone to all three Convex providers, with no ORM and no glue", () => {
      const result = resolve({ database: "convex" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["convex", "convex", "convex-auth"].sort(),
      );
      expect(plan.providers.map((p) => p.layer).sort()).toEqual(
        ["auth", "database", "realtime"].sort(),
      );
      expect(plan.glue).toEqual([]);
    });

    it("pre-fills auth and realtime as convex when only database: convex is given explicitly", () => {
      const result = resolve({ database: "convex" }) as Plan;
      expect(result.providers.find((p) => p.layer === "auth")?.id).toBe("convex-auth");
      expect(result.providers.find((p) => p.layer === "realtime")?.id).toBe("convex");
    });

    it("rejects database: convex with a non-Convex auth provider, naming the conflict", () => {
      const result = resolve({ database: "convex", auth: "clerk" });

      expect(isErrors(result)).toBe(true);
      const errors = (result as { errors: Array<{ message: string }> }).errors;
      expect(errors.some((e) => /convex/i.test(e.message) && /auth/i.test(e.message))).toBe(true);
    });

    it("rejects database: convex with a non-Convex realtime provider, naming the conflict", () => {
      const result = resolve({ database: "convex", realtime: "supabase-realtime" });
      expect(isErrors(result)).toBe(true);
    });

    it("rejects database: convex with any ORM selected, naming the conflict", () => {
      const result = resolve({ database: "convex", orm: "drizzle" });
      expect(isErrors(result)).toBe(true);
    });

    it("accepts database: convex with auth/realtime explicitly set to their Convex values too", () => {
      const result = resolve({ database: "convex", auth: "convex-auth", realtime: "convex" });
      expect(isErrors(result)).toBe(false);
    });

    it("gates convex-auth and convex realtime behind database: convex via their own requires", () => {
      expect(isErrors(resolve({ auth: "convex-auth" }))).toBe(true);
      expect(isErrors(resolve({ realtime: "convex" }))).toBe(true);
    });
  });

  describe("Storage: S3/R2 presigned upload (ticket 013)", () => {
    it("resolves storage: s3-presigned alone to exactly the storage provider", () => {
      const result = resolve({ storage: "s3-presigned" });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id)).toEqual(["s3-presigned"]);
      expect(plan.glue).toEqual([]);
    });

    it("resolves storage alongside the full Neon + Drizzle + Better Auth slice, adding only the storage provider", () => {
      const result = resolve({
        database: "postgres",
        postgresHost: "neon",
        orm: "drizzle",
        auth: "better-auth",
        storage: "s3-presigned",
      });

      expect(isErrors(result)).toBe(false);
      const plan = result as Plan;
      expect(plan.providers.map((p) => p.id).sort()).toEqual(
        ["better-auth", "drizzle", "postgres-neon", "s3-presigned"].sort(),
      );
    });

    it("declares a /files route, distinct from every auth provider's own routes", () => {
      const provider = (resolve({ storage: "s3-presigned" }) as Plan).providers[0];
      expect(provider?.routes).toEqual([
        { path: "files", file: "routes/files.tsx" },
        { path: "upload-url", file: "routes/upload-url.tsx" },
      ]);
    });

    it("has no requires/conflicts, so it never rejects a combination on its own account", () => {
      const provider = (resolve({ storage: "s3-presigned" }) as Plan).providers[0];
      expect(provider?.requires ?? []).toEqual([]);
      expect(provider?.conflicts ?? []).toEqual([]);
    });
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
  it("lists postgres, sqlite, mongodb and convex as database options", () => {
    const result = options("database", {});
    expect(result).toEqual([
      { value: "postgres", label: "PostgreSQL" },
      { value: "sqlite", label: "SQLite (local file)" },
      { value: "mongodb", label: "MongoDB" },
      { value: "convex", label: "Convex (database + auth + realtime bundle)" },
    ]);
  });

  it("lists convex as a realtime option, disabled until database is convex (ticket 012)", () => {
    expect(options("realtime", {})).toEqual([
      {
        value: "convex",
        label: "Convex Realtime",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
    ]);
    expect(options("realtime", { database: "convex" })).toEqual([
      { value: "convex", label: "Convex Realtime" },
    ]);
  });

  it("lists drizzle and prisma as orm options, disabled with a reason until database is postgres", () => {
    expect(options("orm", {})).toEqual([
      {
        value: "drizzle",
        label: "Drizzle",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
      {
        value: "prisma",
        label: "Prisma",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
      {
        value: "mongoose",
        label: "Mongoose",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
    ]);
    expect(options("orm", { database: "postgres" })).toEqual([
      { value: "drizzle", label: "Drizzle" },
      { value: "prisma", label: "Prisma" },
      {
        value: "mongoose",
        label: "Mongoose",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
    ]);
  });

  it("lists better-auth as an auth option, disabled until orm is drizzle and database is postgres", () => {
    const withNothingSelected = options("auth", {});
    const betterAuthOption = withNothingSelected.find((o) => o.value === "better-auth");
    expect(betterAuthOption?.disabled).toBe(true);
    // clerk (009), supabase-auth (010) and firebase-auth (011) have no
    // requires, so none of them is ever disabled by this check.
    expect(withNothingSelected.find((o) => o.value === "clerk")?.disabled).toBeUndefined();
    expect(withNothingSelected.find((o) => o.value === "supabase-auth")?.disabled).toBeUndefined();
    expect(withNothingSelected.find((o) => o.value === "firebase-auth")?.disabled).toBeUndefined();
    // convex-auth (012) requires database: convex, so it IS disabled here.
    expect(withNothingSelected.find((o) => o.value === "convex-auth")?.disabled).toBe(true);

    expect(options("auth", { database: "postgres", orm: "drizzle" })).toEqual([
      { value: "better-auth", label: "Better Auth" },
      { value: "clerk", label: "Clerk" },
      { value: "supabase-auth", label: "Supabase Auth" },
      { value: "firebase-auth", label: "Firebase Auth" },
      {
        value: "convex-auth",
        label: "Convex Auth",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
    ]);
  });

  it("offers drizzle for the Docker host, now that it has a real driver fragment", () => {
    const result = options("orm", { database: "postgres", postgresHost: "docker" });
    expect(result.find((o) => o.value === "drizzle")).toEqual({
      value: "drizzle",
      label: "Drizzle",
    });
  });

  it("still offers drizzle for the Neon host", () => {
    const result = options("orm", { database: "postgres", postgresHost: "neon" });
    expect(result.find((o) => o.value === "drizzle")).toEqual({
      value: "drizzle",
      label: "Drizzle",
    });
  });

  it("offers drizzle for the Supabase host, now that it has a real driver fragment", () => {
    const result = options("orm", { database: "postgres", postgresHost: "supabase" });
    expect(result.find((o) => o.value === "drizzle")).toEqual({
      value: "drizzle",
      label: "Drizzle",
    });
  });

  it("offers drizzle for sqlite — no host-driver concern applies there", () => {
    const result = options("orm", { database: "sqlite" });
    expect(result.find((o) => o.value === "drizzle")).toEqual({
      value: "drizzle",
      label: "Drizzle",
    });
  });

  it("offers better-auth once database is sqlite and orm is drizzle", () => {
    expect(options("auth", { database: "sqlite", orm: "drizzle" })).toEqual([
      { value: "better-auth", label: "Better Auth" },
      { value: "clerk", label: "Clerk" },
      { value: "supabase-auth", label: "Supabase Auth" },
      { value: "firebase-auth", label: "Firebase Auth" },
      {
        value: "convex-auth",
        label: "Convex Auth",
        disabled: true,
        reason: expect.stringContaining("database"),
      },
    ]);
  });

  it("disables drizzle for a future unsupported host", () => {
    const result = options("orm", {
      database: "postgres",
      postgresHost: "cockroach",
    } as unknown as Selections);

    const drizzle = result.find((o) => o.value === "drizzle");
    expect(drizzle?.disabled).toBe(true);
    expect(drizzle?.reason).toContain("neon, docker, supabase");
  });

  describe("MongoDB + Mongoose filtering (ticket 007)", () => {
    it("never offers mongoose unless database is mongodb", () => {
      expect(options("orm", {}).find((o) => o.value === "mongoose")?.disabled).toBe(true);
      expect(
        options("orm", { database: "postgres" }).find((o) => o.value === "mongoose")?.disabled,
      ).toBe(true);
      expect(
        options("orm", { database: "sqlite" }).find((o) => o.value === "mongoose")?.disabled,
      ).toBe(true);
    });

    it("offers mongoose once database is mongodb", () => {
      const result = options("orm", { database: "mongodb" });
      expect(result.find((o) => o.value === "mongoose")).toEqual({
        value: "mongoose",
        label: "Mongoose",
      });
    });

    it("hides drizzle with the exact 'Drizzle and Prisma don't support MongoDB' reason once database is mongodb", () => {
      const result = options("orm", { database: "mongodb" });
      const drizzle = result.find((o) => o.value === "drizzle");
      expect(drizzle?.disabled).toBe(true);
      expect(drizzle?.reason).toBe("Drizzle and Prisma don't support MongoDB");
    });

    it("still disables mongoose for postgres/sqlite with a reason mentioning database", () => {
      const result = options("orm", { database: "postgres" });
      const mongoose = result.find((o) => o.value === "mongoose");
      expect(mongoose?.disabled).toBe(true);
      expect(mongoose?.reason).toContain("database");
    });

    it("hides prisma with the exact 'Drizzle and Prisma don't support MongoDB' reason once database is mongodb", () => {
      const result = options("orm", { database: "mongodb" });
      const prisma = result.find((o) => o.value === "prisma");
      expect(prisma?.disabled).toBe(true);
      expect(prisma?.reason).toBe("Drizzle and Prisma don't support MongoDB");
    });
  });

  describe("Prisma filtering (ticket 008)", () => {
    it("offers prisma for the Docker host", () => {
      const result = options("orm", { database: "postgres", postgresHost: "docker" });
      expect(result.find((o) => o.value === "prisma")).toEqual({
        value: "prisma",
        label: "Prisma",
      });
    });

    it("offers prisma for the Neon host", () => {
      const result = options("orm", { database: "postgres", postgresHost: "neon" });
      expect(result.find((o) => o.value === "prisma")).toEqual({
        value: "prisma",
        label: "Prisma",
      });
    });

    it("offers prisma for the Supabase host", () => {
      const result = options("orm", { database: "postgres", postgresHost: "supabase" });
      expect(result.find((o) => o.value === "prisma")).toEqual({
        value: "prisma",
        label: "Prisma",
      });
    });

    it("offers prisma for sqlite — no host-driver concern applies there", () => {
      const result = options("orm", { database: "sqlite" });
      expect(result.find((o) => o.value === "prisma")).toEqual({
        value: "prisma",
        label: "Prisma",
      });
    });

    it("offers better-auth once database is postgres and orm is prisma", () => {
      expect(options("auth", { database: "postgres", orm: "prisma" })).toEqual([
        { value: "better-auth", label: "Better Auth" },
        { value: "clerk", label: "Clerk" },
        { value: "supabase-auth", label: "Supabase Auth" },
        { value: "firebase-auth", label: "Firebase Auth" },
        {
          value: "convex-auth",
          label: "Convex Auth",
          disabled: true,
          reason: expect.stringContaining("database"),
        },
      ]);
    });

    it("disables prisma for a future unsupported host", () => {
      const result = options("orm", {
        database: "postgres",
        postgresHost: "cockroach",
      } as unknown as Selections);

      const prisma = result.find((o) => o.value === "prisma");
      expect(prisma?.disabled).toBe(true);
      expect(prisma?.reason).toContain("neon, docker, supabase");
    });
  });
});
