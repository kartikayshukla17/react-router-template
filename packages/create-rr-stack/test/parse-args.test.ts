import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTIONS, parseArgs, withDefaults } from "../src/cli/parse-args.js";
import { resolve } from "../src/resolver/resolve.js";
import { isErrors } from "../src/resolver/types.js";

describe("parseArgs (ticket 016)", () => {
  it("parses a project name as the first positional argument", () => {
    const result = parseArgs(["my-app"]);
    expect(result.projectName).toBe("my-app");
    expect(result.errors).toEqual([]);
  });

  it("parses every selection flag", () => {
    const result = parseArgs([
      "my-app",
      "--db",
      "postgres",
      "--postgres-host",
      "neon",
      "--orm",
      "drizzle",
      "--auth",
      "better-auth",
      "--storage",
      "s3-presigned",
      "--realtime",
      "supabase-realtime",
    ]);

    expect(result.errors).toEqual([]);
    expect(result.selections).toMatchObject({
      database: "postgres",
      postgresHost: "neon",
      orm: "drizzle",
      auth: "better-auth",
      storage: "s3-presigned",
      realtime: "supabase-realtime",
    });
  });

  it("parses --mongo-host alongside --db mongodb", () => {
    const result = parseArgs(["my-app", "--db", "mongodb", "--mongo-host", "docker"]);
    expect(result.errors).toEqual([]);
    expect(result.selections.mongoHost).toBe("docker");
  });

  it('treats "none" as explicitly unsetting orm/auth/storage/realtime, matching the interactive flow\'s "None" option', () => {
    const result = parseArgs(["my-app", "--orm", "none", "--auth", "none"]);
    expect(result.errors).toEqual([]);
    expect(result.selections.orm).toBeUndefined();
    expect(result.selections.auth).toBeUndefined();
  });

  it("parses --shadcn and --docker as boolean presence flags", () => {
    const result = parseArgs(["my-app", "--shadcn", "--docker"]);
    expect(result.errors).toEqual([]);
    expect(result.extras.shadcn).toBe(true);
    expect(result.extras.docker).toBe(true);
    expect(result.extras.example).toBe(true);
  });

  it("parses --no-example into extras.example = false", () => {
    const result = parseArgs(["my-app", "--no-example"]);
    expect(result.errors).toEqual([]);
    expect(result.extras.example).toBe(false);
  });

  it("parses --no-install, --no-git, --yes, and --pm", () => {
    const result = parseArgs(["my-app", "--no-install", "--no-git", "--yes", "--pm", "pnpm"]);
    expect(result.errors).toEqual([]);
    expect(result.noInstall).toBe(true);
    expect(result.noGit).toBe(true);
    expect(result.yes).toBe(true);
    expect(result.pm).toBe("pnpm");
  });

  it("defaults noInstall/noGit/yes to false and pm to undefined when absent", () => {
    const result = parseArgs(["my-app"]);
    expect(result.noInstall).toBe(false);
    expect(result.noGit).toBe(false);
    expect(result.yes).toBe(false);
    expect(result.pm).toBeUndefined();
  });

  it("rejects an unknown flag with a clear, listed error — never throws", () => {
    let result: ReturnType<typeof parseArgs> | undefined;
    expect(() => {
      result = parseArgs(["my-app", "--not-a-real-flag"]);
    }).not.toThrow();
    expect(result?.errors.some((e) => e.includes("--not-a-real-flag"))).toBe(true);
  });

  it("rejects a value-taking flag with a missing value", () => {
    const result = parseArgs(["my-app", "--db"]);
    expect(result.errors.some((e) => e.includes("--db"))).toBe(true);
  });

  it("rejects an invalid --pm value, listing the valid alternatives", () => {
    const result = parseArgs(["my-app", "--pm", "deno"]);
    expect(result.errors.some((e) => e.includes("npm") && e.includes("pnpm"))).toBe(true);
  });

  it("works with no project name given at all (flags only)", () => {
    const result = parseArgs(["--yes"]);
    expect(result.projectName).toBeUndefined();
    expect(result.yes).toBe(true);
  });

  it("DEFAULT_SELECTIONS resolves cleanly with no errors — the --yes baseline is itself valid", () => {
    const result = resolve(DEFAULT_SELECTIONS);
    expect(isErrors(result)).toBe(false);
  });
});

describe("withDefaults (ticket 016)", () => {
  it("fills database/orm with DEFAULT_SELECTIONS when nothing was given", () => {
    expect(withDefaults({})).toEqual(DEFAULT_SELECTIONS);
  });

  it("lets an explicitly-given selection override the default", () => {
    expect(withDefaults({ auth: "clerk" })).toMatchObject({
      database: "sqlite",
      orm: "drizzle",
      auth: "clerk",
    });
  });

  it("defaults postgresHost to docker when database: postgres was chosen with no host", () => {
    expect(withDefaults({ database: "postgres" })).toMatchObject({
      database: "postgres",
      postgresHost: "docker",
    });
  });

  it("doesn't override an explicitly-given postgresHost", () => {
    expect(withDefaults({ database: "postgres", postgresHost: "neon" })).toMatchObject({
      postgresHost: "neon",
    });
  });

  it("defaults mongoHost to docker when database: mongodb was chosen with no host", () => {
    expect(withDefaults({ database: "mongodb" })).toMatchObject({
      database: "mongodb",
      mongoHost: "docker",
    });
  });

  it("resolves cleanly for postgres/mongodb with only --db given, thanks to the host backstop", () => {
    expect(isErrors(resolve(withDefaults({ database: "postgres" })))).toBe(false);
    expect(isErrors(resolve(withDefaults({ database: "mongodb" })))).toBe(false);
  });

  it("doesn't force a postgresHost/mongoHost default onto an unrelated database choice", () => {
    const result = withDefaults({ database: "sqlite" });
    expect(result.postgresHost).toBeUndefined();
    expect(result.mongoHost).toBeUndefined();
  });
});
