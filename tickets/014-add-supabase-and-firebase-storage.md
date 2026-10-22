# 014 — Add Supabase Storage and Firebase Storage

**Depends on:** 005, 011, 013
**Slice type:** vertical

## Summary
Add the two BaaS-native storage options, reusing the shared Supabase and Firebase
client fragments from 005 and 011 — the second and third proof that a shared BaaS
client installs once regardless of how many layers use it.

## Scope
- Provider `storage/supabase-storage`: implementation over the shared Supabase
  client's storage API; bucket name env var.
- Provider `storage/firebase-storage`: implementation over the shared Firebase
  client's storage API.
- Resolver: both appear at the storage prompt alongside S3/R2 and none; no `requires`
  on a matching database/auth choice — Supabase Storage works even if auth is Clerk,
  Firebase Storage works even if the database is Neon.

## Acceptance criteria
- [ ] Supabase Storage + Clerk auth + Neon database generates and builds (storage
  provider independent of auth/database choice).
- [ ] Firebase Storage + Better Auth + Docker Postgres generates and builds.
- [ ] Choosing both Supabase Auth (010) and Supabase Storage in the same run writes
  the shared Supabase client fragment exactly once.
- [ ] `app/server/storage.ts` contract (`getUploadUrl`/`getDownloadUrl`/`remove`) is
  identical in shape across S3/R2, Supabase, and Firebase (shared contract test).

## Out of scope
Realtime layer (015).
