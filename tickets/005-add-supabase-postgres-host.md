# 005 — Add Supabase Postgres host

**Depends on:** 003
**Slice type:** vertical

## Summary
Add Supabase as a Postgres host, which also unlocks the Supabase BaaS client as a
shared dependency for later tickets (010 auth, 014 storage, 015 realtime).

## Scope
- Provider `database/postgres` `host: supabase`: `DATABASE_URL` (direct connection)
  env var, pointer to where in the Supabase dashboard to find it.
- Shared `supabase` BaaS client fragment: installs `@supabase/supabase-js` once,
  creates `app/server/supabase-client.ts`, and is reused (not reinstalled) by any
  other layer that also picks Supabase (010, 014, 015) — this is where the "install
  the BaaS client once" rule from the PRD gets its first real test.
- Resolver: Postgres prompt now offers Neon, Docker, Supabase.

## Acceptance criteria
- [ ] Selecting Postgres → Supabase → Drizzle → Better Auth generates and builds, with
  `DATABASE_URL` and the Supabase project URL/anon key in `.env.example`.
- [ ] The Supabase client fragment is written exactly once even if a later ticket's
  manual test also picks Supabase Auth or Storage (verified here with a resolver unit
  test using a stub second Supabase layer, ahead of 010/014 landing for real).
- [ ] Printed next steps point at the Supabase dashboard's connection-string page.

## Out of scope
Supabase Auth, Storage, Realtime themselves (010, 014, 015) — this ticket only lands
the database host and the shared client seam they'll reuse.
