# 007 — Add MongoDB + Mongoose

**Depends on:** 003
**Slice type:** vertical

## Summary
Add the one non-SQL database/ORM pair in v1, proving the resolver's filtering rule
that Mongoose is only ever offered when the database is MongoDB (and vice versa — no
Drizzle/Prisma for Mongo).

## Scope
- Provider `database/mongodb`: local Docker Compose entry (mongo image) plus a hosted
  option (connection-string env var, no account creation by the CLI).
- Provider `orm/mongoose`: schema/model file, connection helper.
- Resolver rules: `mongoose.requires = [database: mongodb]`,
  `mongodb` only offers `mongoose` or `none` at the ORM prompt (Drizzle/Prisma hidden,
  with the reason "Drizzle and Prisma don't support MongoDB" shown inline).
- Glue fragment `better-auth+mongoose`: Better Auth's community Mongo adapter, or — if
  it doesn't exist/isn't maintained — document that choice in this ticket's notes and
  fall back to session-cookie-only Better Auth config without a database adapter.
- `/notes` demo route adapted for a Mongoose model.

## Acceptance criteria
- [ ] Choosing MongoDB at the database prompt hides Drizzle and Prisma from the next
  prompt, with a visible reason.
- [ ] Choosing any non-Mongo database hides Mongoose, with a visible reason.
- [ ] MongoDB + Mongoose + Better Auth generates, installs, typechecks, and builds.
- [ ] `/notes` create/delete round-trips against Mongo via Mongoose.
- [ ] A resolver unit test asserts Mongoose never appears in `options("orm", ...)`
  unless `database === "mongodb"`.

## Out of scope
Convex (012, which is also non-SQL but handled as its own bundle).
