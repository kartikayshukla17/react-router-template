import { describe, expect, it } from "vitest";
import type { Glue, Plan, Provider } from "../src/resolver/types.js";
import { MemoryFileSystem } from "../src/scaffolder/fs/memory-fs.js";
import { scaffold } from "../src/scaffolder/scaffold.js";

const postgresDockerFixture: Provider = {
  layer: "database",
  id: "postgres-docker",
  label: "PostgreSQL (Docker)",
  deps: { pg: "^8.13.0" },
  devDeps: {},
  env: [
    {
      name: "DATABASE_URL",
      description: "Postgres connection string",
      whereToFind: "docker-compose.yml",
      secret: true,
    },
  ],
  files: "providers/database/postgres-docker",
  fileManifest: ["docker-compose.yml"],
  nextSteps: ["Run `docker compose up -d`."],
};

function planWith(providers: Provider[], glue: Glue[] = [], includeDemo = true): Plan {
  return {
    providers,
    glue,
    installOrder: providers.map((p) => p.id),
    env: providers.flatMap((p) => p.env),
    nextSteps: providers.flatMap((p) => p.nextSteps),
    includeDemo,
  };
}

describe("scaffold", () => {
  it("writes a provider's files, merges package.json, and lists every path written", async () => {
    const fs = new MemoryFileSystem({
      "providers/database/postgres-docker/docker-compose.yml":
        "services:\n  postgres:\n    image: postgres:17\n",
    });

    const result = await scaffold(planWith([postgresDockerFixture]), "/out", fs);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.writtenPaths).toContain("/out/docker-compose.yml");
    expect(result.writtenPaths).toContain("/out/package.json");
    expect(result.writtenPaths).toContain("/out/.env.example");
    expect(result.writtenPaths).toContain("/out/app/routes.ts");
    expect(result.writtenPaths).toHaveLength(4);

    await expect(fs.readFile("/out/docker-compose.yml")).resolves.toContain("postgres:17");

    const pkgRaw = await fs.readFile("/out/package.json");
    expect(pkgRaw).toBeDefined();
    const pkg = JSON.parse(pkgRaw as string) as { dependencies: Record<string, string> };
    expect(pkg.dependencies.pg).toBe("^8.13.0");

    const envRaw = await fs.readFile("/out/.env.example");
    expect(envRaw).toContain("DATABASE_URL=");
  });

  it("produces a Result with no written provider files for an empty plan, but still writes merge targets", async () => {
    const fs = new MemoryFileSystem();

    const result = await scaffold(planWith([]), "/out", fs);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.writtenPaths).toEqual([
      "/out/package.json",
      "/out/.env.example",
      "/out/app/routes.ts",
    ]);
  });

  it("merges into an existing package.json instead of clobbering it", async () => {
    const fs = new MemoryFileSystem({
      "providers/database/postgres-docker/docker-compose.yml": "services: {}\n",
      "/out/package.json": JSON.stringify({ name: "my-app", dependencies: { react: "^19.0.0" } }),
    });

    const result = await scaffold(planWith([postgresDockerFixture]), "/out", fs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const pkgRaw = await fs.readFile("/out/package.json");
    const pkg = JSON.parse(pkgRaw as string) as {
      name: string;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe("my-app");
    expect(pkg.dependencies.react).toBe("^19.0.0");
    expect(pkg.dependencies.pg).toBe("^8.13.0");
  });

  it("fails with a named PATH_COLLISION error when two fragments claim the same path", async () => {
    const fragmentA: Provider = {
      ...postgresDockerFixture,
      id: "fragment-a",
      fileManifest: ["shared.yml"],
    };
    const fragmentB: Provider = {
      ...postgresDockerFixture,
      id: "fragment-b",
      fileManifest: ["shared.yml"],
    };
    const fs = new MemoryFileSystem({
      "providers/database/postgres-docker/shared.yml": "a",
    });

    const result = await scaffold(planWith([fragmentA, fragmentB]), "/out", fs);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PATH_COLLISION");
    expect(result.error.path).toBe("/out/shared.yml");
    expect(result.error.fragments).toEqual(["fragment-a", "fragment-b"]);
    expect(result.error.message).toContain("fragment-a");
    expect(result.error.message).toContain("fragment-b");
    expect(result.error.message).toContain("/out/shared.yml");
  });

  it("fails with a named PATH_COLLISION error when a fragment claims a merge-target path (package.json)", async () => {
    const clobberingFragment: Provider = {
      ...postgresDockerFixture,
      id: "clobbering-fragment",
      fileManifest: ["package.json"],
    };
    const fs = new MemoryFileSystem({
      "providers/database/postgres-docker/package.json": "{}",
    });

    const result = await scaffold(planWith([clobberingFragment]), "/out", fs);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PATH_COLLISION");
    expect(result.error.path).toBe("/out/package.json");
    expect(result.error.message).toContain("package.json");
    expect(result.error.message).toContain("clobbering-fragment");
  });

  it("fails with a named PATH_COLLISION error when a fragment claims a merge-target path (.env.example)", async () => {
    const clobberingFragment: Provider = {
      ...postgresDockerFixture,
      id: "clobbering-fragment",
      fileManifest: [".env.example"],
    };
    const fs = new MemoryFileSystem({
      "providers/database/postgres-docker/.env.example": "",
    });

    const result = await scaffold(planWith([clobberingFragment]), "/out", fs);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PATH_COLLISION");
    expect(result.error.path).toBe("/out/.env.example");
    expect(result.error.message).toContain(".env.example");
    expect(result.error.message).toContain("clobbering-fragment");
  });

  it("fails with a named PATH_COLLISION error when a fragment claims a merge-target path (app/routes.ts)", async () => {
    const clobberingFragment: Provider = {
      ...postgresDockerFixture,
      id: "clobbering-fragment",
      fileManifest: ["app/routes.ts"],
    };
    const fs = new MemoryFileSystem({
      "providers/database/postgres-docker/app/routes.ts": "",
    });

    const result = await scaffold(planWith([clobberingFragment]), "/out", fs);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PATH_COLLISION");
    expect(result.error.path).toBe("/out/app/routes.ts");
    expect(result.error.message).toContain("app/routes.ts");
    expect(result.error.message).toContain("clobbering-fragment");
  });

  it("merges a provider's declared routes into app/routes.ts, falling back to the home index route otherwise", async () => {
    const fs = new MemoryFileSystem();

    const emptyPlanResult = await scaffold(planWith([]), "/out", fs);
    expect(emptyPlanResult.ok).toBe(true);
    await expect(fs.readFile("/out/app/routes.ts")).resolves.toContain('index("routes/home.tsx")');

    const providerWithRoutes: Provider = {
      ...postgresDockerFixture,
      fileManifest: [],
      routes: [{ path: "files", file: "routes/files.tsx" }],
    };
    const result = await scaffold(planWith([providerWithRoutes]), "/out2", fs);
    expect(result.ok).toBe(true);
    const routesTs = await fs.readFile("/out2/app/routes.ts");
    expect(routesTs).toContain('route("files", "routes/files.tsx")');
    // No provider declared an index route here, so the fallback still applies.
    expect(routesTs).toContain('index("routes/home.tsx")');
  });

  it("writes a glue fragment's files and merges its deps into package.json", async () => {
    const glueFixture: Glue = {
      between: ["drizzle", "better-auth"],
      files: "glue/better-auth+drizzle",
      deps: { "extra-glue-dep": "^1.0.0" },
      fileManifest: ["app/server/auth.ts"],
    };
    const fs = new MemoryFileSystem({
      "glue/better-auth+drizzle/app/server/auth.ts": "export const auth = {};\n",
    });

    const result = await scaffold(planWith([], [glueFixture]), "/out", fs);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.writtenPaths).toContain("/out/app/server/auth.ts");

    const pkgRaw = await fs.readFile("/out/package.json");
    const pkg = JSON.parse(pkgRaw as string) as { dependencies: Record<string, string> };
    expect(pkg.dependencies["extra-glue-dep"]).toBe("^1.0.0");
  });

  it("fails with a named PATH_COLLISION error when a provider and a glue fragment claim the same path", async () => {
    const provider: Provider = {
      ...postgresDockerFixture,
      id: "orm-fragment",
      fileManifest: ["app/server/auth.ts"],
    };
    const glueFixture: Glue = {
      between: ["drizzle", "better-auth"],
      files: "glue/better-auth+drizzle",
      fileManifest: ["app/server/auth.ts"],
    };
    const fs = new MemoryFileSystem({
      "providers/database/postgres-docker/app/server/auth.ts": "a",
      "glue/better-auth+drizzle/app/server/auth.ts": "b",
    });

    const result = await scaffold(planWith([provider], [glueFixture]), "/out", fs);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PATH_COLLISION");
    expect(result.error.fragments).toEqual(["orm-fragment", "drizzle+better-auth"]);
  });

  it("fails with a named error when a declared fragment file is missing from the source fs", async () => {
    const fs = new MemoryFileSystem(); // no source files seeded

    const result = await scaffold(planWith([postgresDockerFixture]), "/out", fs);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MISSING_FRAGMENT_FILE");
    expect(result.error.message).toContain("postgres-docker");
  });
});
