/**
 * Prompt options for a given layer, aware of selections already made
 * (`partial`) so the CLI shell can grey out choices that would be
 * unresolvable. Pure, like `resolve()` — no I/O.
 */

import type { Layer, Option, Selections } from "./types.js";

const DATABASE_OPTIONS: Option[] = [{ value: "postgres", label: "PostgreSQL" }];

export function options(layer: Layer, partial: Selections): Option[] {
  // `partial` is accepted now so the signature matches the PRD and later
  // tickets (which add requires/conflicts-aware disabling) don't need to
  // change callers. No layer registered yet needs it to decide anything.
  void partial;

  if (layer === "database") {
    return DATABASE_OPTIONS.map((option) => ({ ...option }));
  }

  // No providers registered yet for orm/auth/storage/realtime.
  return [];
}
