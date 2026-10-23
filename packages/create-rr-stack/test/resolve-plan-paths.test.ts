import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolvePlanFragmentPaths } from "../src/cli/resolve-plan-paths.js";
import { resolve } from "../src/resolver/resolve.js";
import { NodeFileSystem } from "../src/scaffolder/fs/node-fs.js";
import { scaffold } from "../src/scaffolder/scaffold.js";

/**
 * Regression coverage for the review finding that selecting Postgres+Docker
 * through the CLI resolved fine but then `scaffold()` failed with
 * `MISSING_FRAGMENT_FILE`, because `postgres-docker`'s `files` field (a
 * templates-root-relative path) was never turned into an absolute path the
 * way the Neon/Drizzle/Better-Auth providers' `files` were. Both now
 * declare `files` the same way (templates-root-relative), and
 * `resolvePlanFragmentPaths` is the one place — called once, right before
 * `scaffold()` — that turns every fragment's `files` into a real absolute
 * path. This test proves the Docker-host path actually reads its real
 * `docker-compose.yml` off disk end-to-end, through the real `NodeFileSystem`.
 */
describe("resolvePlanFragmentPaths + scaffold (Docker-host, real filesystem)", () => {
  let targetDir: string | undefined;

  afterEach(async () => {
    if (targetDir) {
      await rm(targetDir, { recursive: true, force: true });
    }
  });

  it("writes postgres-docker's real docker-compose.yml instead of failing with MISSING_FRAGMENT_FILE", async () => {
    const plan = resolve({ database: "postgres", postgresHost: "docker" });
    if ("errors" in plan) {
      throw new Error(`expected a Plan, got errors: ${JSON.stringify(plan.errors)}`);
    }

    targetDir = await mkdtemp(path.join(os.tmpdir(), "create-rr-stack-docker-"));

    const result = await scaffold(resolvePlanFragmentPaths(plan), targetDir, new NodeFileSystem());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const written = await readFile(path.join(targetDir, "docker-compose.yml"), "utf8");
    expect(written).toContain("postgres");
  });
});
