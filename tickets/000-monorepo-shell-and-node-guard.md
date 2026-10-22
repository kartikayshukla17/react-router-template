# 000 — Monorepo shell + Node version guard

**Depends on:** —
**Slice type:** horizontal (foundation; nothing to cut vertically yet)

## Summary
Create the npm-workspaces monorepo skeleton and the one piece of behaviour that has
to exist before any prompt runs: refusing to proceed on an unsupported Node version.

## Scope
- `package.json` at repo root with npm workspaces: `packages/*`.
- `packages/create-rr-stack/` with its own `package.json`, TypeScript config, tsdown
  build config, Vitest config.
- MIT `LICENSE`.
- `.gitignore`, `.editorconfig`, Biome config at the repo root.
- `node-guard.ts`: reads `process.version`, compares against `>=22.22.0`, and either
  returns ok or a formatted message (required vs current version, upgrade hints for
  fnm/nvm/brew). Called first thing in `cli.ts`, before any prompt or flag parsing.
- Empty `templates/` directory with a `.gitkeep`, ready for 002.

## Acceptance criteria
- [ ] `npm install` at repo root succeeds and links the workspace.
- [ ] `npm run build -w create-rr-stack` produces a runnable CLI entry.
- [ ] Running the built CLI under Node < 22.22.0 prints the required/current version
  and an upgrade hint, then exits 1, before anything else happens.
- [ ] Running it under Node >= 22.22.0 passes the guard and falls through (no prompts
  wired yet — printing "ok" is enough for this ticket).
- [ ] `node-guard.ts` has unit tests for: below floor, at floor, above floor, and an
  unparseable version string.

## Out of scope
Prompts, resolver, scaffolder, any provider — all later tickets.
