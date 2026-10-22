# 003 — First full stack slice: Neon + Drizzle + Better Auth + demo

**Depends on:** 001, 002
**Slice type:** vertical — this is the ticket that proves the whole system end to end

## Summary
Wire the CLI shell (clack prompts for this one path), the resolver, the scaffolder,
three real providers, their glue, and the demo app together so that
`npm create rr-stack` with this exact combination produces a project that installs,
typechecks, builds, and runs a working demo. This is the slice every later provider
ticket is added alongside, not the slice everything else depends on being rebuilt from.

## Scope
- CLI shell (`cli.ts`): clack prompts in order (database → host → ORM → auth →
  extras), confirm screen, calls `scaffold()`, prints next steps. No flags yet (016).
- Providers: `database/postgres` with `host: neon` (manifest + `@neondatabase/serverless`
  + `DATABASE_URL` env var with "where to find it" pointing at the Neon dashboard),
  `orm/drizzle` (schema file, `drizzle.config.ts`, `db:push`/`db:studio` scripts),
  `auth/better-auth`.
- Glue fragment `better-auth+drizzle`: users table, Better Auth's Drizzle adapter wired
  into `app/server/auth.ts` and `app/server/db.ts`.
- Demo routes, on by default: `/` landing, `/sign-in`, `/dashboard` (redirects
  unauthenticated via `requireUser`), `/notes` (create/delete against the db).
- `rr-stack.json` written into the generated project (cliVersion, selections,
  generatedAt).
- Per-provider "next steps" checklist printed after generation (env vars, where to get
  them, local commands to run).
- Non-empty target directory: confirm/overwrite/cancel prompt.
- Ctrl+C at any prompt: clean exit, nothing written to disk (scaffolding only happens
  after the confirm step).

## Acceptance criteria
- [ ] Running the CLI, answering Postgres → Neon → Drizzle → Better Auth, generates a
  project that `npm install && npm run typecheck && npm run build` all pass (with a
  real or placeholder `DATABASE_URL` as the build needs).
- [ ] `/dashboard` redirects to `/sign-in` when unauthenticated.
- [ ] Creating and deleting a note round-trips through Drizzle.
- [ ] No demo route or component imports `@neondatabase/serverless`, `drizzle-orm`, or
  `better-auth` directly — only `app/server/{db,auth}.ts`.
- [ ] `rr-stack.json` exists in the generated project with correct `selections`.
- [ ] Printed next steps name `DATABASE_URL` and point at the Neon dashboard.
- [ ] Ctrl+C before the confirm screen leaves the target directory empty.
- [ ] Re-running against a non-empty directory prompts before writing anything.

## Out of scope
Every other provider, flags/`--yes` mode, CI combo matrix (one manual run is enough
proof for this ticket; 017 automates it).
