# 010 — Add Supabase Auth

**Depends on:** 005
**Slice type:** vertical

## Summary
Add Supabase Auth, and prove the "mix providers across layers" promise from the PRD by
generating the Firebase-Auth-with-Neon-style combination explicitly for Supabase:
Supabase Auth with a *different* database.

## Scope
- Provider `auth/supabase-auth`: reuses the shared Supabase client fragment from 005
  if a Supabase layer is already selected, otherwise installs it fresh (auth alone,
  no Supabase database).
- `app/server/auth.ts` implementation over `supabase-js` auth methods.
- Resolver: Supabase Auth is independent of the database layer — selectable with
  Neon, Docker Postgres, SQLite, or no database at all.

## Acceptance criteria
- [ ] Supabase Auth + Neon Postgres + Drizzle generates, installs, typechecks, and
  builds — the literal cross-layer-mixing example from the grilling session.
- [ ] Supabase Auth + Supabase Postgres host shares one Supabase client fragment, not
  two (resolver test + generated file list both confirm single install).
- [ ] Supabase Auth + SQLite (no Supabase database at all) still builds.
- [ ] Contract test from 008/009 passes against this implementation too.

## Out of scope
Firebase Auth (011), Supabase Storage/Realtime (014, 015 — those reuse this ticket's
shared-client pattern but are separate tickets).
