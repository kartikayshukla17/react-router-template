#!/usr/bin/env node
import { runCli } from "./cli/run.js";
import { checkNodeVersion } from "./node-guard.js";

async function main(): Promise<void> {
  const guard = checkNodeVersion(process.version);
  if (!guard.ok) {
    console.error(guard.message);
    process.exitCode = 1;
    return;
  }

  process.exitCode = await runCli(process.argv.slice(2), process.env);
}

main();
