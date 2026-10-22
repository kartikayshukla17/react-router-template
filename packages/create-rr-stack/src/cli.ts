#!/usr/bin/env node
import { checkNodeVersion } from "./node-guard.js";

function main(): void {
  const guard = checkNodeVersion(process.version);
  if (!guard.ok) {
    console.error(guard.message);
    process.exitCode = 1;
    return;
  }

  // Prompts, flags and scaffolding are wired in later tickets.
  console.log("ok");
}

main();
