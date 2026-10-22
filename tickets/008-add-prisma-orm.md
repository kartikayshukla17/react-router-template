# 008 — Add Prisma as an ORM alternative

**Depends on:** 003
**Slice type:** vertical

## Summary
Add Prisma as the second SQL ORM choice, proving a layer can have more than one
provider without touching any other layer's fragments.

## Scope
- Provider `orm/prisma`: `schema.prisma`, generated client wiring in
  `app/server/db.ts`, `db:push`/`db:studio` scripts (Prisma's own, replacing Drizzle's
  in the generated `package.json` scripts block).
- Glue fragment `better-auth+prisma`: Better Auth's Prisma adapter, users model.
- Resolver: ORM prompt now offers Drizzle or Prisma for Postgres/SQLite, unchanged for
  Mongo (007) and Convex (012, where no ORM prompt appears at all).

## Acceptance criteria
- [ ] Postgres (any host) → Prisma → Better Auth generates, installs, typechecks, and
  builds.
- [ ] SQLite → Prisma → Better Auth generates and builds.
- [ ] Switching between Drizzle and Prisma for the same database/host/auth
  combination only changes files under the ORM's own fragment and the glue fragment —
  `app/server/auth.ts`'s public interface (`getSession`/`requireUser`/`signOut`) is
  identical either way, verified by a shared contract test run against both.

## Out of scope
Any new database or auth provider.
