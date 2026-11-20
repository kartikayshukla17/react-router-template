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
 * Ticket 009's "same contract test from 008 run against Clerk" acceptance
 * criterion: Clerk's `app/server/auth.ts` must expose the same
 * `getSession`/`requireUser`/`signOut` surface (names + arity, PRD.md §9) as
 * Better Auth's, even though Clerk needs no ORM glue fragment to get there.
 * Mirrors `orm-contract.test.ts`'s mechanism exactly — generate real
 * projects through the real resolver → scaffolder pipeline, extract
 * exported function signatures with the same deliberately simple regex
 * (see that file's doc comment for why: no in-process TS parser available).
 */

interface ExportedFunctionSignature {
  name: string;
  paramCount: number;
}

const EXPORTED_FUNCTION_PATTERN = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;

function extractExportedFunctionSignatures(source: string): ExportedFunctionSignature[] {
  const signatures: ExportedFunctionSignature[] = [];

  for (const match of source.matchAll(EXPORTED_FUNCTION_PATTERN)) {
    const [, name, rawParams] = match;
    if (name === undefined || rawParams === undefined) {
      continue;
    }
    const trimmed = rawParams.trim();
    const paramCount = trimmed === "" ? 0 : trimmed.split(",").length;
    signatures.push({ name, paramCount });
  }

  return signatures.sort((a, b) => a.name.localeCompare(b.name));
}

/** The fixed cross-provider interface (PRD.md §9) this ticket's criterion names. */
const PUBLIC_INTERFACE_NAMES = ["getSession", "requireUser", "signOut"];

async function generateAuthTs(selections: Selections, tmpDirPrefix: string): Promise<string> {
  const result = resolve(selections);
  if ("errors" in result) {
    throw new Error(
      `resolve() returned errors for ${JSON.stringify(selections)}: ${JSON.stringify(result.errors)}`,
    );
  }
  const plan: Plan = resolvePlanFragmentPaths(result);

  const targetDir = await mkdtemp(path.join(os.tmpdir(), tmpDirPrefix));
  const scaffoldResult = await scaffold(plan, targetDir, new NodeFileSystem());
  if (!scaffoldResult.ok) {
    throw new Error(`scaffold() failed: ${scaffoldResult.error.message}`);
  }

  const authTsPath = path.join(targetDir, "app", "server", "auth.ts");
  const content = await readFile(authTsPath, "utf8");

  await rm(targetDir, { recursive: true, force: true });
  return content;
}

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

describe("Clerk plan scaffolds without collisions (ticket 009)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("scaffolds Clerk with no database: deps/env merged, notes.tsx still lands (against the throwing db stub)", async () => {
    const targetDir = await generateProject({ auth: "clerk" }, "rr-stack-clerk-nodb-scaffold-");
    tempDirs.push(targetDir);

    const pkg = JSON.parse(await readFile(path.join(targetDir, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["@clerk/react-router"]).toBeDefined();
    expect(pkg.dependencies["@clerk/backend"]).toBeDefined();

    const envExample = await readFile(path.join(targetDir, ".env.example"), "utf8");
    expect(envExample).toContain("VITE_CLERK_PUBLISHABLE_KEY=");
    expect(envExample).toContain("CLERK_SECRET_KEY=");

    // Clerk's notes.tsx ships unconditionally (its fragment is
    // self-contained, like better-auth+<orm>'s demo routes); with no
    // database selected it still typechecks against the base stub's
    // throwing listNotes/createNote/deleteNote (app/server/db.ts).
    await expect(
      readFile(path.join(targetDir, "app", "routes", "notes.tsx"), "utf8"),
    ).resolves.toContain("listNotes");
    await expect(
      readFile(path.join(targetDir, "app", "server", "db.ts"), "utf8"),
    ).resolves.toContain("notConfigured");
  });

  it("scaffolds Clerk + Postgres + Drizzle with no path collision, keeping both fragments' files", async () => {
    const targetDir = await generateProject(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", auth: "clerk" },
      "rr-stack-clerk-drizzle-scaffold-",
    );
    tempDirs.push(targetDir);

    // Clerk's own notes.tsx (from its self-contained fragment) and
    // Drizzle's db.ts/schema.ts (from the ORM+host glue fragment,
    // independent of which auth provider was chosen) coexist.
    await expect(
      readFile(path.join(targetDir, "app", "routes", "notes.tsx"), "utf8"),
    ).resolves.toContain("requireUser");
    await expect(
      readFile(path.join(targetDir, "app", "server", "db.ts"), "utf8"),
    ).resolves.toContain("listNotes");
    await expect(
      readFile(path.join(targetDir, "app", "server", "auth.ts"), "utf8"),
    ).resolves.toContain("@clerk/backend");
  });
});

describe("Clerk vs. Better Auth auth.ts contract (ticket 009)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("exports the identical getSession/requireUser/signOut surface for Clerk with no database as for Better Auth + Drizzle + Postgres", async () => {
    const betterAuthTs = await generateAuthTs(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", auth: "better-auth" },
      "rr-stack-better-auth-",
    );
    const clerkAuthTs = await generateAuthTs({ auth: "clerk" }, "rr-stack-clerk-nodb-");

    const betterAuthSignatures = extractExportedFunctionSignatures(betterAuthTs);
    const clerkSignatures = extractExportedFunctionSignatures(clerkAuthTs);

    for (const name of PUBLIC_INTERFACE_NAMES) {
      const betterAuthFn = betterAuthSignatures.find((s) => s.name === name);
      const clerkFn = clerkSignatures.find((s) => s.name === name);
      expect(betterAuthFn, `Better Auth auth.ts should export ${name}`).toBeDefined();
      expect(clerkFn, `Clerk auth.ts should export ${name}`).toBeDefined();
      expect(clerkFn?.paramCount).toBe(betterAuthFn?.paramCount);
    }
  });

  it("exports the identical getSession/requireUser/signOut surface for Clerk + Postgres + Drizzle as for Clerk alone", async () => {
    const clerkNoDbAuthTs = await generateAuthTs({ auth: "clerk" }, "rr-stack-clerk-nodb-2-");
    const clerkWithDbAuthTs = await generateAuthTs(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", auth: "clerk" },
      "rr-stack-clerk-drizzle-",
    );

    expect(extractExportedFunctionSignatures(clerkWithDbAuthTs)).toEqual(
      extractExportedFunctionSignatures(clerkNoDbAuthTs),
    );
  });
});

describe("Supabase Auth scaffolds without collisions (ticket 010)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("scaffolds Supabase Auth + Neon Postgres + Drizzle — the literal cross-layer-mixing example", async () => {
    const targetDir = await generateProject(
      { database: "postgres", postgresHost: "neon", orm: "drizzle", auth: "supabase-auth" },
      "rr-stack-supabase-auth-neon-",
    );
    tempDirs.push(targetDir);

    await expect(
      readFile(path.join(targetDir, "app", "server", "auth.ts"), "utf8"),
    ).resolves.toContain("createSupabaseServerClient");
    await expect(
      readFile(path.join(targetDir, "app", "server", "supabase-client.ts"), "utf8"),
    ).resolves.toContain("createSupabaseServerClient");
  });

  it("shares exactly one supabase-client.ts file for Supabase Auth + Supabase Postgres host, not two", async () => {
    const targetDir = await generateProject(
      { database: "postgres", postgresHost: "supabase", orm: "drizzle", auth: "supabase-auth" },
      "rr-stack-supabase-auth-supabase-pg-",
    );
    tempDirs.push(targetDir);

    const pkg = JSON.parse(await readFile(path.join(targetDir, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["@supabase/supabase-js"]).toBeDefined();
    expect(pkg.dependencies["@supabase/ssr"]).toBeDefined();

    await expect(
      readFile(path.join(targetDir, "app", "server", "supabase-client.ts"), "utf8"),
    ).resolves.toContain("createSupabaseServerClient");
  });
});

describe("Supabase Auth vs. Better Auth auth.ts contract (ticket 010)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("exports the identical getSession/requireUser/signOut surface for Supabase Auth with no database as for Better Auth + Drizzle + Postgres", async () => {
    const betterAuthTs = await generateAuthTs(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", auth: "better-auth" },
      "rr-stack-better-auth-2-",
    );
    const supabaseAuthTs = await generateAuthTs(
      { auth: "supabase-auth" },
      "rr-stack-supabase-auth-nodb-",
    );

    const betterAuthSignatures = extractExportedFunctionSignatures(betterAuthTs);
    const supabaseAuthSignatures = extractExportedFunctionSignatures(supabaseAuthTs);

    for (const name of PUBLIC_INTERFACE_NAMES) {
      const betterAuthFn = betterAuthSignatures.find((s) => s.name === name);
      const supabaseAuthFn = supabaseAuthSignatures.find((s) => s.name === name);
      expect(betterAuthFn, `Better Auth auth.ts should export ${name}`).toBeDefined();
      expect(supabaseAuthFn, `Supabase Auth auth.ts should export ${name}`).toBeDefined();
      expect(supabaseAuthFn?.paramCount).toBe(betterAuthFn?.paramCount);
    }
  });
});

describe("Firebase Auth scaffolds without collisions (ticket 011)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("scaffolds Firebase Auth + Neon Postgres + Drizzle — the grilling-round-3 combination", async () => {
    const targetDir = await generateProject(
      { database: "postgres", postgresHost: "neon", orm: "drizzle", auth: "firebase-auth" },
      "rr-stack-firebase-auth-neon-",
    );
    tempDirs.push(targetDir);

    const pkg = JSON.parse(await readFile(path.join(targetDir, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies.firebase).toBeDefined();
    expect(pkg.dependencies["firebase-admin"]).toBeDefined();

    await expect(
      readFile(path.join(targetDir, "app", "server", "auth.ts"), "utf8"),
    ).resolves.toContain("firebase-admin");
    await expect(
      readFile(path.join(targetDir, "app", "routes", "sign-in.tsx"), "utf8"),
    ).resolves.toContain("firebase/auth");
    await expect(
      readFile(path.join(targetDir, "app", "lib", "firebase-client.ts"), "utf8"),
    ).resolves.toContain("firebaseAuth");
  });

  it("scaffolds Firebase Auth with no database — notes.tsx still lands against the throwing db stub", async () => {
    const targetDir = await generateProject(
      { auth: "firebase-auth" },
      "rr-stack-firebase-auth-nodb-",
    );
    tempDirs.push(targetDir);

    const envExample = await readFile(path.join(targetDir, ".env.example"), "utf8");
    expect(envExample).toContain("VITE_FIREBASE_API_KEY=");
    expect(envExample).toContain("FIREBASE_PRIVATE_KEY=");

    await expect(
      readFile(path.join(targetDir, "app", "routes", "notes.tsx"), "utf8"),
    ).resolves.toContain("listNotes");
  });
});

describe("Firebase Auth vs. Better Auth auth.ts contract (ticket 011)", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("exports the identical getSession/requireUser/signOut surface for Firebase Auth with no database as for Better Auth + Drizzle + Postgres", async () => {
    const betterAuthTs = await generateAuthTs(
      { database: "postgres", postgresHost: "docker", orm: "drizzle", auth: "better-auth" },
      "rr-stack-better-auth-3-",
    );
    const firebaseAuthTs = await generateAuthTs(
      { auth: "firebase-auth" },
      "rr-stack-firebase-auth-nodb-2-",
    );

    const betterAuthSignatures = extractExportedFunctionSignatures(betterAuthTs);
    const firebaseAuthSignatures = extractExportedFunctionSignatures(firebaseAuthTs);

    for (const name of PUBLIC_INTERFACE_NAMES) {
      const betterAuthFn = betterAuthSignatures.find((s) => s.name === name);
      const firebaseAuthFn = firebaseAuthSignatures.find((s) => s.name === name);
      expect(betterAuthFn, `Better Auth auth.ts should export ${name}`).toBeDefined();
      expect(firebaseAuthFn, `Firebase Auth auth.ts should export ${name}`).toBeDefined();
      expect(firebaseAuthFn?.paramCount).toBe(betterAuthFn?.paramCount);
    }
  });
});
