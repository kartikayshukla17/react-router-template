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
 * Ticket 015: Supabase Realtime's `/notes` live-update seam
 * (`app/lib/notes-realtime.ts`, stub-vs-override, same discipline as
 * `app/server/auth.ts`/`db.ts`). Real-pipeline tests, same mechanism as
 * `storage.test.ts`.
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

describe("Supabase Realtime + /notes live updates (ticket 015)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("resolves Supabase Realtime + Neon database + Clerk auth, independent of database/auth", async () => {
    const targetDir = await generateProject(
      {
        database: "postgres",
        postgresHost: "neon",
        orm: "drizzle",
        auth: "clerk",
        realtime: "supabase-realtime",
      },
      "rr-stack-realtime-neon-clerk-",
    );
    tempDirs.push(targetDir);

    await expect(
      readFile(path.join(targetDir, "app", "server", "realtime.ts"), "utf8"),
    ).resolves.toContain("subscribe");
    const notesRealtimeTs = await readFile(
      path.join(targetDir, "app", "lib", "notes-realtime.ts"),
      "utf8",
    );
    expect(notesRealtimeTs).toContain("useRevalidator");
    expect(notesRealtimeTs).not.toContain("export function useNotesRealtime(): void {}");

    // Clerk's notes.tsx calls the real hook/notify, not the base no-op stub.
    const notesTsx = await readFile(path.join(targetDir, "app", "routes", "notes.tsx"), "utf8");
    expect(notesTsx).toContain("useNotesRealtime();");
    expect(notesTsx).toContain("await notifyNotesChanged();");
  });

  it("with realtime = none, /notes behaves exactly as in 003: the base no-op stub, no extra code generated", async () => {
    const targetDir = await generateProject(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", auth: "better-auth" },
      "rr-stack-realtime-none-",
    );
    tempDirs.push(targetDir);

    const notesRealtimeTs = await readFile(
      path.join(targetDir, "app", "lib", "notes-realtime.ts"),
      "utf8",
    );
    expect(notesRealtimeTs).toContain("export function useNotesRealtime(): void {}");
    expect(notesRealtimeTs).toContain(
      "export async function notifyNotesChanged(): Promise<void> {}",
    );

    // The base template's own pre-existing throwing stub for app/server/
    // realtime.ts (PRD's fixed subscribe/publish shape) stays untouched —
    // no realtime provider overwrote it with a real implementation.
    await expect(
      readFile(path.join(targetDir, "app", "server", "realtime.ts"), "utf8"),
    ).resolves.toContain("notConfigured");
  });

  it("shares exactly one supabase-client fragment when Realtime is combined with Supabase Auth and Storage together", async () => {
    const targetDir = await generateProject(
      { auth: "supabase-auth", storage: "supabase-storage", realtime: "supabase-realtime" },
      "rr-stack-realtime-triple-share-",
    );
    tempDirs.push(targetDir);

    const pkg = JSON.parse(await readFile(path.join(targetDir, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    // @supabase/supabase-js is declared exactly once on the shared
    // fragment; mergePackageJson would silently dedupe a double-declare
    // too, so the real signal is the resolver-level provider count
    // (resolver.test.ts), not this — this just confirms the file content
    // a real pipeline run produces is sane.
    expect(pkg.dependencies["@supabase/supabase-js"]).toBeDefined();
    await expect(
      readFile(path.join(targetDir, "app", "server", "supabase-client.ts"), "utf8"),
    ).resolves.toContain("createSupabaseServerClient");
  });
});
