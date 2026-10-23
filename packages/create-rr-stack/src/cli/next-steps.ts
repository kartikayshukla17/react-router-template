import * as p from "@clack/prompts";
import type { Plan } from "../resolver/types.js";

/**
 * Formats and prints the per-provider "next steps" checklist (PRD.md §9,
 * US7): every required env var, what it is, and where to find it, plus
 * each provider's own setup step (e.g. "run `npm run db:push`").
 */
export function printNextSteps(plan: Plan, projectName: string): void {
  const lines: string[] = [`cd ${projectName}`, "npm install"];

  // Whether there's "nothing to configure" is a property of the whole
  // resolved plan's env requirements (every selected provider across every
  // layer — database, ORM, auth, storage, realtime, baas), not of any one
  // provider's own `nextSteps`. A provider with zero env vars of its own
  // (e.g. SQLite) can still sit in a plan that needs env vars from another
  // provider (e.g. Better Auth's secret), so this must be checked on the
  // final assembled `plan.env`, not delegated to a single provider's
  // hardcoded string (see sqlite.ts for the finding this fixes).
  if (plan.env.length === 0) {
    lines.push("", "Nothing to configure — just run `npm run dev`.");
  } else {
    lines.push("", "Fill in these environment variables in .env:");
    for (const envVar of plan.env) {
      lines.push(`  ${envVar.name} — ${envVar.description}`);
      lines.push(`    Where to find it: ${envVar.whereToFind}`);
    }

    if (plan.nextSteps.length > 0) {
      lines.push("", "Provider setup:");
      for (const step of plan.nextSteps) {
        lines.push(`  - ${step}`);
      }
    }
  }

  lines.push("", "npm run dev");

  p.note(lines.join("\n"), "Next steps");
}
