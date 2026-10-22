# 013 — Add storage layer: S3/R2 presigned upload

**Depends on:** 003
**Slice type:** vertical

## Summary
Add the storage layer for the first time, using the presigned-upload pattern
(mentioned in grilling as something already built before). This is the first ticket
to exercise `app/server/storage.ts` and the `/files` demo route.

## Scope
- Provider `storage/s3-presigned`: works for both AWS S3 and Cloudflare R2 (same
  S3-compatible API, different endpoint env var), checksum validation on upload,
  orphaned-file cleanup job (a simple cron-style script, not a background worker).
- `app/server/storage.ts` implementation: `getUploadUrl`, `getDownloadUrl`, `remove`.
- `/files` demo route: upload form + list, only generated when a storage layer is
  picked.
- Storage prompt appears after auth in the CLI flow, offering S3/R2 or none (Supabase
  and Firebase Storage arrive in 014).

## Acceptance criteria
- [ ] Selecting S3/R2 storage alongside the 003 slice generates a project that
  installs, typechecks, and builds.
- [ ] `/files` doesn't generate at all when storage is "none" (verified by file-list
  diff between the two runs).
- [ ] `getUploadUrl` returns a presigned URL and headers; no AWS/R2 SDK import appears
  outside `app/server/storage.ts`.
- [ ] Next steps checklist lists bucket name, region/endpoint, and access key env
  vars, with a note on checksum validation and the cleanup script.

## Out of scope
Supabase Storage, Firebase Storage (014).
