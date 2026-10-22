# 012 — Add Convex (database + auth + realtime bundle)

**Depends on:** 001
**Slice type:** vertical

## Summary
Add Convex, and resolve the open PRD question about whether it's three separate layer
choices or one bundle shortcut. Decision for this ticket: **three choices in the
prompt list, pre-selected together.** Picking Convex at the database prompt sets
Convex as the answer for ORM (hidden/skipped — Convex has no separate ORM), auth, and
realtime automatically, with a one-line note explaining why those prompts were
skipped. The user can still override auth or realtime afterward if the resolver allows
a non-Convex choice alongside a Convex database (it doesn't, in v1 — Convex is
all-or-nothing across database/auth/realtime, which is the simplest correct behavior
and is called out explicitly rather than silently assumed).

## Scope
- Provider `database/convex`, `auth/convex-auth`, `realtime/convex`, all gated
  together by one resolver rule: selecting any one pre-selects/locks the other two.
- No ORM prompt appears at all once Convex is chosen (Convex's client is the data
  layer).
- `app/server/db.ts`, `app/server/auth.ts`, `app/server/realtime.ts` implementations
  over the Convex client/functions.
- `/notes` demo adapted to a Convex function/query instead of an ORM call.
- `CONVEX_DEPLOYMENT` env var / `npx convex dev` as the local setup step in next steps.

## Acceptance criteria
- [ ] Choosing Convex at the database prompt skips the ORM prompt entirely and
  pre-fills auth and realtime as Convex, with the skip reason shown.
- [ ] Attempting `--db convex --auth clerk` in flag mode (ahead of 016 landing fully,
  stub the check here) is rejected with a clear error naming the conflict.
- [ ] Convex (all three layers) generates, installs, typechecks, and builds.
- [ ] `/notes` round-trips through a Convex function.
- [ ] PRD's open question on Convex is marked resolved, referencing this ticket.

## Out of scope
Mixing Convex with a non-Convex layer — explicitly disallowed in v1, not deferred
silently.
