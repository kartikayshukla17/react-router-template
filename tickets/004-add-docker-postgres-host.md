# 004 — Add Docker Postgres host

**Depends on:** 003
**Slice type:** vertical

## Summary
Add the self-hosted Postgres path so people without a Neon/Supabase account can still
pick Postgres + Drizzle (or later, Prisma) and get a working local database.

## Scope
- Provider `database/postgres` `host: docker`: `docker-compose.yml` (postgres image,
  named volume, exposed port), local `DATABASE_URL` pointing at it, no external env
  var checklist item beyond "run `docker compose up -d`".
- Resolver option: Postgres prompt now offers Docker as well as Neon.
- `db:push`, `db:studio` scripts already exist from Drizzle (003); verify they work
  against the Docker host unchanged.

## Acceptance criteria
- [ ] Selecting Postgres → Docker → Drizzle → Better Auth generates a project with a
  `docker-compose.yml` and a `DATABASE_URL` that matches it.
- [ ] `docker compose up -d && npm run db:push` succeeds locally (manual verification
  acceptable here; automated in 017).
- [ ] Printed next steps say to run Docker Compose, with no account-signup step.
- [ ] Neon path (003) is unaffected — both hosts resolve to the same `database/postgres`
  provider id with different `host` metadata, so ORM and auth fragments don't change.

## Out of scope
Supabase host (005), any non-Postgres database.
