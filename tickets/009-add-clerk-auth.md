# 009 — Add Clerk auth

**Depends on:** 003
**Slice type:** vertical

## Summary
Add the first third-party, no-ORM-required auth provider, proving the "auth providers
other than Better Auth need nothing from the database layer" rule from the PRD.

## Scope
- Provider `auth/clerk`: `app/server/auth.ts` implementation calling Clerk's
  server SDK, Clerk's own sign-in/sign-up components for the `/sign-in` route,
  `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` env vars with a pointer to the Clerk
  dashboard.
- Resolver: when `auth === "clerk"`, no ORM-auth glue fragment is selected; the
  provider's own `requires` is empty for the database layer (any database, or none,
  is valid alongside Clerk).
- Per PRD decision, no user-sync table: the `/notes` demo stores Clerk's user id as a
  plain text column/field, not a foreign key into a users table Better Auth would
  have created.

## Acceptance criteria
- [ ] Clerk + no database generates, installs, typechecks, and builds (auth doesn't
  force a database choice).
- [ ] Clerk + Postgres/Drizzle also builds, with notes scoped by Clerk's user id
  stored as text.
- [ ] `/dashboard` protection and `requireUser`/`getSession`/`signOut` behave
  identically in shape to the Better Auth implementation (same contract test from 008
  run against Clerk).
- [ ] Next steps checklist names both Clerk keys and the dashboard page to find them.

## Out of scope
Supabase Auth (010), Firebase Auth (011).
