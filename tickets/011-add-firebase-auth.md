# 011 — Add Firebase Auth

**Depends on:** 003
**Slice type:** vertical

## Summary
Add Firebase Auth and generate the exact combination the user asked about directly in
grilling round 3: Firebase Auth with Neon Postgres.

## Scope
- Shared `firebase` BaaS client fragment (installs `firebase`/`firebase-admin` once,
  `app/server/firebase-client.ts`), reused later by Firebase Storage (014).
- Provider `auth/firebase-auth`: `app/server/auth.ts` implementation over Firebase
  Admin SDK session verification, `FIREBASE_*` env vars, pointer to the Firebase
  console.
- Resolver: Firebase Auth independent of database layer, same as Clerk/Supabase Auth.

## Acceptance criteria
- [ ] Firebase Auth + Neon Postgres + Drizzle generates, installs, typechecks, and
  builds.
- [ ] Firebase Auth + SQLite also builds.
- [ ] Contract test from 008/009/010 passes against this implementation.
- [ ] Next steps checklist names every required Firebase env var and where in the
  console to find it.

## Out of scope
Firebase Storage (014) — lands separately, reusing this ticket's shared client.
