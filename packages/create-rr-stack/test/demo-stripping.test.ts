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
 * Ticket 016's `--no-example`: real-pipeline tests, same mechanism as
 * `storage.test.ts`/`realtime.test.ts`. Core wiring (`auth.ts`/`db.ts`/
 * `storage.ts`) must still ship and still typecheck against with the demo
 * stripped — this is what `Provider.demoFileManifest`/`demoRoutes` exist
 * to make possible without a dozen provider variants.
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

describe("--no-example strips the demo UI but keeps core wiring (ticket 016)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("strips Better Auth's demo routes (sign-in/dashboard/notes) but keeps app/server/auth.ts", async () => {
    const targetDir = await generateProject(
      {
        database: "postgres",
        postgresHost: "docker",
        orm: "drizzle",
        auth: "better-auth",
        extras: { shadcn: false, docker: false, example: false },
      },
      "rr-stack-no-example-better-auth-",
    );
    tempDirs.push(targetDir);

    await expect(
      readFile(path.join(targetDir, "app", "server", "auth.ts"), "utf8"),
    ).resolves.toContain("requireUser");
    await expect(
      readFile(path.join(targetDir, "app", "routes", "sign-in.tsx"), "utf8"),
    ).rejects.toThrow();
    await expect(
      readFile(path.join(targetDir, "app", "routes", "dashboard.tsx"), "utf8"),
    ).rejects.toThrow();
    await expect(
      readFile(path.join(targetDir, "app", "routes", "notes.tsx"), "utf8"),
    ).rejects.toThrow();

    // No provider declared an index route either, so routes.ts falls back
    // to the base template's own landing page, not Better Auth's demo home.
    const routesTs = await readFile(path.join(targetDir, "app", "routes.ts"), "utf8");
    expect(routesTs).toContain('index("routes/home.tsx")');
    expect(routesTs).not.toContain("sign-in");
  });

  it("strips S3 storage's /files demo but keeps app/server/storage.ts and the cleanup script", async () => {
    const targetDir = await generateProject(
      { storage: "s3-presigned", extras: { shadcn: false, docker: false, example: false } },
      "rr-stack-no-example-s3-",
    );
    tempDirs.push(targetDir);

    await expect(
      readFile(path.join(targetDir, "app", "server", "storage.ts"), "utf8"),
    ).resolves.toContain("getUploadUrl");
    await expect(
      readFile(path.join(targetDir, "scripts", "cleanup-orphaned-files.ts"), "utf8"),
    ).resolves.toContain("MIN_AGE_MS");
    await expect(
      readFile(path.join(targetDir, "app", "routes", "files.tsx"), "utf8"),
    ).rejects.toThrow();

    const routesTs = await readFile(path.join(targetDir, "app", "routes.ts"), "utf8");
    expect(routesTs).not.toContain("files");
  });

  it("with example left on (default), the demo still ships exactly as before", async () => {
    const targetDir = await generateProject(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", auth: "better-auth" },
      "rr-stack-example-on-",
    );
    tempDirs.push(targetDir);

    await expect(
      readFile(path.join(targetDir, "app", "routes", "sign-in.tsx"), "utf8"),
    ).resolves.toContain("signInWithPassword");
  });
});
