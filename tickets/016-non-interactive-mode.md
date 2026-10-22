# 016 — Non-interactive mode: flags, `--yes`, package-manager detection

**Depends on:** 003
**Slice type:** vertical

## Summary
Give every prompt a flag equivalent, so the exact same resolver/scaffolder path that
backs the interactive CLI also runs headless for scripts and AI agents.

## Scope
- Flags: `--db`, `--postgres-host`, `--orm`, `--auth`, `--storage`, `--realtime`,
  `--shadcn`, `--docker`, `--no-example`, `--no-install`, `--no-git`,
  `--pm <npm|pnpm|yarn|bun>`, `--yes`.
- `--yes` fills any unspecified flag with the resolver's documented defaults rather
  than prompting.
- Package-manager auto-detection: inspect the invoking command (`npm_config_user_agent`
  or equivalent) and pick the install command accordingly; `--pm` overrides detection.
- Git-init prompt becomes `--no-git` in flag mode (defaults to initializing).
- Invalid flag combination (e.g. `--orm mongoose --db postgres`, or the Convex
  conflict from 012) exits 1 with the same error shape the resolver already produces
  for prompts, listing valid alternatives.
- Non-TTY stdout: plain text output, no color, no spinners.

## Acceptance criteria
- [ ] `npx create-rr-stack my-app --db postgres --postgres-host neon --orm drizzle --auth better-auth --yes --no-install` runs with zero prompts and exits 0.
- [ ] Every flag has a documented default used under `--yes`.
- [ ] An invalid combination passed via flags exits 1 with the same message a user
  would see hitting it in the interactive prompt flow.
- [ ] Package manager is correctly detected when invoked via `npm create`, `pnpm create`, `yarn create`, and `bun create` (tested by mocking the user-agent env var).
- [ ] Piping CLI output to a file (non-TTY) produces plain, colorless, readable text.

## Out of scope
The `rr-stack add` command (explicitly out of scope for v1 per PRD).
