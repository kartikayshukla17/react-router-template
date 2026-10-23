import * as p from "@clack/prompts";
import type { Plan } from "../resolver/types.js";

/**
 * Formats and prints the per-provider "next steps" checklist (PRD.md §9,
 * US7): every required env var, what it is, and where to find it, plus
 * each provider's own setup step (e.g. "run `npm run db:push`").
 */
export function printNextSteps(plan: Plan, projectName: string): void {
  const lines: string[] = [`cd ${projectName}`, "npm install"];

  if (plan.env.length > 0) {
    lines.push("", "Fill in these environment variables in .env:");
    for (const envVar of plan.env) {
      lines.push(`  ${envVar.name} — ${envVar.description}`);
      lines.push(`    Where to find it: ${envVar.whereToFind}`);
    }
  }

  if (plan.nextSteps.length > 0) {
    lines.push("", "Provider setup:");
    for (const step of plan.nextSteps) {
      lines.push(`  - ${step}`);
    }
  }

  lines.push("", "npm run dev");

  p.note(lines.join("\n"), "Next steps");
}
