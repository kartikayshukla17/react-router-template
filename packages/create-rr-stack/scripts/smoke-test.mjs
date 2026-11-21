#!/usr/bin/env node
/**
 * Runtime smoke test for a generated app (combo-matrix.yml's
 * `runtimeSmoke` matrix entries).
 *
 * `combo-matrix.yml`'s install/typecheck/build steps only prove a
 * generated combo *compiles* — they never run the server or touch the
 * database. This script does: it starts the generated app's production
 * server for real, then drives a real sign-up and a real note
 * create/list/delete through plain HTTP requests (no mocks, no jsdom —
 * the same `Form`-post requests a non-JS browser would send), asserting
 * each note actually round-trips through the chosen database. It's the
 * only thing in this repo that would catch a route that throws the
 * moment it actually runs, or an ORM client that can't reach the
 * database it was just pointed at.
 *
 * Only wired up for combos with zero external-service dependencies: a
 * self-hosted database (SQLite, Docker Postgres, Docker Mongo) paired
 * with Better Auth, which needs nothing but a secret this script invents
 * — never a real account or API key. Every other combo (Neon, Supabase,
 * Firebase, Clerk, Convex, hosted Mongo, S3) stays at typecheck/build
 * only in `combo-matrix.yml`, for the same reason the Convex combo
 * already skips typecheck/build: this repo's CI has no secret for a real
 * third-party account.
 *
 * Usage: node scripts/smoke-test.mjs <app-dir> [--db-push]
 * Required env: PORT, BETTER_AUTH_SECRET, BETTER_AUTH_URL, plus whichever
 * of DATABASE_URL / MONGODB_URI the combo's database provider reads.
 */
import { spawn } from "node:child_process";
import process from "node:process";

const [appDir, ...rest] = process.argv.slice(2);
if (!appDir) {
  console.error("Usage: node scripts/smoke-test.mjs <app-dir> [--db-push]");
  process.exit(1);
}
const shouldDbPush = rest.includes("--db-push");

const port = process.env.PORT ?? "3100";
const baseUrl = `http://localhost:${port}`;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: appDir, stdio: "inherit", env: process.env });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function waitForServer(serverExit, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(baseUrl + "/");
      if (res.ok) return;
    } catch {
      // Not listening yet — keep polling.
    }
    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, 300)),
      serverExit.then(() => {
        throw new Error("Server process exited before it ever came up");
      }),
    ]);
  }
  throw new Error(`Server never came up at ${baseUrl} within ${timeoutMs}ms`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

/** Collapses a response's `Set-Cookie` header(s) into a `Cookie` header for reuse. */
function cookieHeaderFrom(headers) {
  const setCookies = headers.getSetCookie?.() ?? [headers.get("set-cookie")].filter(Boolean);
  assert(setCookies.length > 0, "response had no Set-Cookie header");
  return setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function main() {
  if (shouldDbPush) {
    console.log("--- db:push ---");
    await run("npm", ["run", "db:push"]);
  }

  console.log("--- build ---");
  await run("npm", ["run", "build"]);

  console.log("--- start ---");
  const server = spawn("npm", ["run", "start"], { cwd: appDir, stdio: "inherit", env: process.env });
  let serverExited = false;
  const serverExit = new Promise((resolve) => {
    server.on("exit", (code) => {
      serverExited = true;
      resolve(code);
    });
  });

  try {
    await waitForServer(serverExit);
    assert(!serverExited, "server exited while waiting for it to come up");

    console.log("--- GET / ---");
    const home = await fetch(baseUrl + "/");
    assert(home.status === 200, `GET / returned ${home.status}, expected 200`);

    const email = `smoke-${Date.now()}@example.com`;
    console.log("--- sign up ---");
    const signUpRes = await fetch(baseUrl + "/sign-in", {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email, password: "smoke-test-password-123", mode: "sign-up" }),
    });
    assert(signUpRes.status === 303, `sign-up POST returned ${signUpRes.status}, expected a 303 redirect`);
    const cookie = cookieHeaderFrom(signUpRes.headers);

    const title = `Smoke test note ${Date.now()}`;
    console.log("--- create note ---");
    const createRes = await fetch(baseUrl + "/notes", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie },
      body: new URLSearchParams({ intent: "create", title, content: "created by smoke-test.mjs" }),
    });
    assert(createRes.status === 200, `create note returned ${createRes.status}, expected 200`);
    assert((await createRes.text()).includes(title), "created note's title is missing from the re-rendered /notes page");

    console.log("--- list notes ---");
    const listRes = await fetch(baseUrl + "/notes", { headers: { cookie } });
    const listHtml = await listRes.text();
    assert(listRes.status === 200, `GET /notes returned ${listRes.status}, expected 200`);
    assert(listHtml.includes(title), "created note is missing from a fresh GET /notes — it wasn't actually persisted");

    const idMatch = listHtml.match(/name="id" value="([^"]+)"/);
    assert(idMatch, "could not find the created note's id in the rendered page");

    console.log("--- delete note ---");
    const deleteRes = await fetch(baseUrl + "/notes", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie },
      body: new URLSearchParams({ intent: "delete", id: idMatch[1] }),
    });
    assert(deleteRes.status === 200, `delete note returned ${deleteRes.status}, expected 200`);

    console.log("--- verify deleted ---");
    const afterDeleteHtml = await (await fetch(baseUrl + "/notes", { headers: { cookie } })).text();
    assert(!afterDeleteHtml.includes(title), "deleted note is still present — delete didn't actually remove it");

    console.log(
      "Smoke test passed: a real sign-up plus a note create/list/delete round-tripped through the real server and database.",
    );
  } finally {
    if (!serverExited) {
      server.kill("SIGTERM");
      await Promise.race([serverExit, new Promise((resolve) => setTimeout(resolve, 5000))]);
      if (!serverExited) server.kill("SIGKILL");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
