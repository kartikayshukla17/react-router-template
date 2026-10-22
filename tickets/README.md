# Tickets — create-rr-stack

Cut from [../PRD.md](../PRD.md). Each ticket is a **vertical slice**: it touches whatever
it needs across the resolver, provider manifests, template files, and CI in order to
land one complete, demoable, testable increment — never "finish the resolver for every
layer" as an isolated horizontal pass disconnected from a working build.

Two tickets are the exception and stay horizontal on purpose, because nothing vertical
can stand on them yet: **000** (repo shell, nothing to slice) and **002** (the base app,
which every fragment overlays onto). Every ticket from **003** on is a vertical slice.

## Sequence

| # | Ticket | Depends on |
|---|--------|------------|
| 000 | [Monorepo shell + Node version guard](000-monorepo-shell-and-node-guard.md) | — |
| 001 | [Resolver + scaffolder engine, proven on one provider](001-resolver-and-scaffolder-engine.md) | 000 |
| 002 | [Base React Router v8 app](002-base-app.md) | 000 |
| 003 | [First full stack slice: Neon + Drizzle + Better Auth + demo](003-first-full-stack-slice.md) | 001, 002 |
| 004 | [Add Docker Postgres host](004-add-docker-postgres-host.md) | 003 |
| 005 | [Add Supabase Postgres host](005-add-supabase-postgres-host.md) | 003 |
| 006 | [Add SQLite database](006-add-sqlite-database.md) | 003 |
| 007 | [Add MongoDB + Mongoose](007-add-mongodb-and-mongoose.md) | 003 |
| 008 | [Add Prisma as an ORM alternative](008-add-prisma-orm.md) | 003 |
| 009 | [Add Clerk auth](009-add-clerk-auth.md) | 003 |
| 010 | [Add Supabase Auth](010-add-supabase-auth.md) | 005 |
| 011 | [Add Firebase Auth](011-add-firebase-auth.md) | 003 |
| 012 | [Add Convex (database + auth + realtime bundle)](012-add-convex-bundle.md) | 001 |
| 013 | [Add storage layer: S3/R2 presigned upload](013-add-storage-s3-r2.md) | 003 |
| 014 | [Add Supabase Storage and Firebase Storage](014-add-supabase-and-firebase-storage.md) | 005, 011, 013 |
| 015 | [Add realtime layer: Supabase Realtime](015-add-supabase-realtime.md) | 005, 013 |
| 016 | [Non-interactive mode: flags, `--yes`, package-manager detection](016-non-interactive-mode.md) | 003 |
| 017 | [CI combo matrix + file-list snapshots](017-ci-combo-matrix-and-snapshots.md) | 006, 007, 009, 011, 012 |
| 018 | [Weekly dependency-bump job](018-weekly-dependency-bump-job.md) | 017 |
| 019 | [npm publish readiness + launch](019-npm-publish-and-launch.md) | 017 |

Open questions carried over from the PRD (package name, Convex prompt shape) are
resolved inside tickets 012 and 019, not left loose.
