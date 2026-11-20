import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { copyBaseTemplate } from "../src/cli/base-copy.js";
import { resolvePlanFragmentPaths } from "../src/cli/resolve-plan-paths.js";
import { resolve } from "../src/resolver/resolve.js";
import type { Plan, Selections } from "../src/resolver/types.js";
import { NodeFileSystem } from "../src/scaffolder/fs/node-fs.js";
import { scaffold } from "../src/scaffolder/scaffold.js";

/**
 * Ticket 013: the first time two independently-selected layers (auth and
 * storage) both need to add top-level routes to the same generated
 * `app/routes.ts`. Real-pipeline tests, same mechanism as
 * `auth-contract.test.ts` — generate real projects via resolve() →
 * scaffold(), not a hand-rolled stand-in for that pipeline.
 */
async function generateProject(selections: Selections, tmpDirPrefix: string): Promise<string> {
  const result = resolve(selections);
  if ("errors" in result) {
    throw new Error(
      `resolve() returned errors for ${JSON.stringify(selections)}: ${JSON.stringify(result.errors)}`,
    );
  }
  const plan: Plan = resolvePlanFragmentPaths(result);

  const targetDir = await mkdtemp(path.join(os.tmpdir(), tmpDirPrefix));
  await copyBaseTemplate(targetDir);
  const scaffoldResult = await scaffold(plan, targetDir, new NodeFileSystem());
  if (!scaffoldResult.ok) {
    throw new Error(`scaffold() failed: ${scaffoldResult.error.message}`);
  }
  return targetDir;
}

describe("S3/R2 storage + /files demo (ticket 013)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("scaffolds storage alongside the 003 slice (Neon + Drizzle + Better Auth): /files coexists with /dashboard and /notes", async () => {
    const targetDir = await generateProject(
      {
        database: "postgres",
        postgresHost: "neon",
        orm: "drizzle",
        auth: "better-auth",
        storage: "s3-presigned",
      },
      "rr-stack-storage-003-",
    );
    tempDirs.push(targetDir);

    const routesTs = await readFile(path.join(targetDir, "app", "routes.ts"), "utf8");
    expect(routesTs).toContain('index("routes/home.tsx")');
    expect(routesTs).toContain('route("sign-in", "routes/sign-in.tsx")');
    expect(routesTs).toContain('route("dashboard", "routes/dashboard.tsx")');
    expect(routesTs).toContain('route("notes", "routes/notes.tsx")');
    expect(routesTs).toContain('route("files", "routes/files.tsx")');
    expect(routesTs).toContain('route("upload-url", "routes/upload-url.tsx")');

    await expect(
      readFile(path.join(targetDir, "app", "server", "storage.ts"), "utf8"),
    ).resolves.toContain("getUploadUrl");
    // No AWS/R2 SDK import outside app/server/storage.ts.
    await expect(
      readFile(path.join(targetDir, "app", "routes", "files.tsx"), "utf8"),
    ).resolves.not.toContain("@aws-sdk");
  });

  it("doesn't generate /files at all when storage is none — a file-list diff between the two runs", async () => {
    const withStorage = await generateProject(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", storage: "s3-presigned" },
      "rr-stack-storage-with-",
    );
    const withoutStorage = await generateProject(
      { database: "postgres", postgresHost: "docker", orm: "drizzle" },
      "rr-stack-storage-without-",
    );
    tempDirs.push(withStorage, withoutStorage);

    await expect(
      readFile(path.join(withStorage, "app", "routes", "files.tsx"), "utf8"),
    ).resolves.toContain("listFiles");
    await expect(
      readFile(path.join(withoutStorage, "app", "routes", "files.tsx"), "utf8"),
    ).rejects.toThrow();

    const routesWithout = await readFile(path.join(withoutStorage, "app", "routes.ts"), "utf8");
    expect(routesWithout).not.toContain("files");
  });

  it("resolves storage independently of database/orm (no requires): s3-presigned alone still builds the app", async () => {
    const targetDir = await generateProject({ storage: "s3-presigned" }, "rr-stack-storage-only-");
    tempDirs.push(targetDir);

    const pkg = JSON.parse(await readFile(path.join(targetDir, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.dependencies["@aws-sdk/client-s3"]).toBeDefined();
    expect(pkg.dependencies["@aws-sdk/s3-request-presigner"]).toBeDefined();
    expect(pkg.devDependencies.tsx).toBeDefined();
    expect(pkg.scripts["storage:cleanup"]).toBe("tsx scripts/cleanup-orphaned-files.ts");

    const envExample = await readFile(path.join(targetDir, ".env.example"), "utf8");
    expect(envExample).toContain("S3_BUCKET=");
    expect(envExample).toContain("S3_REGION=");
    expect(envExample).toContain("S3_ENDPOINT=");
    expect(envExample).toContain("S3_ACCESS_KEY_ID=");
    expect(envExample).toContain("S3_SECRET_ACCESS_KEY=");
  });
});
