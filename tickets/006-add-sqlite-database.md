# 006 — Add SQLite database

**Depends on:** 003
**Slice type:** vertical

## Summary
Add SQLite as a zero-account, zero-Docker database option — the fastest possible path
from `npm create rr-stack` to a running demo.

## Scope
- Provider `database/sqlite`: local file db (`better-sqlite3` or libSQL), Drizzle
  schema variant for SQLite's type differences from Postgres.
- Resolver: database prompt gains SQLite; ORM prompt still offers Drizzle (and later
  Prisma, 008) for it.
- Glue fragment `better-auth+drizzle` extended to work against either Postgres or
  SQLite schemas (same adapter, different schema file).
- No env vars required at all for this combination — note that explicitly in the
  printed next steps ("nothing to configure, just run `npm run dev`").

## Acceptance criteria
- [ ] Selecting SQLite → Drizzle → Better Auth generates a project with zero required
  env vars and `npm run dev` works immediately after install.
- [ ] `/notes` create/delete round-trips against the SQLite file.
- [ ] Switching the earlier Neon/Docker/Supabase slices to SQLite and back doesn't
  require touching `app/server/auth.ts` — only `app/server/db.ts` and the schema file
  change.

## Out of scope
MongoDB (007), Convex (012).
