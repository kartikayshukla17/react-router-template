# 015 — Add realtime layer: Supabase Realtime

**Depends on:** 005, 013
**Slice type:** vertical

## Summary
Add the realtime layer for the non-Convex path (Convex's realtime landed bundled in
012). This is the last of the five PRD layers to get an implementation.

## Scope
- Provider `realtime/supabase-realtime`: `app/server/realtime.ts` implementation
  (`subscribe`, `publish`) over the shared Supabase client's realtime channels.
- Realtime prompt appears last in the CLI flow (after storage), offering Supabase
  Realtime or none when the database/auth/storage choices don't already imply Convex.
- `/notes` demo extended, when realtime is selected, to reflect live updates when a
  note is created/deleted in another tab (smallest possible demonstration).

## Acceptance criteria
- [ ] Supabase Realtime + Neon database + Clerk auth generates and builds (realtime
  independent of which database/auth providers are chosen, so long as it isn't
  Convex).
- [ ] With realtime = none, `/notes` behaves exactly as in 003 with no extra code
  generated.
- [ ] A second browser tab receives a live update within a few seconds of a note
  being created, verified manually (automated E2E is out of scope per PRD).
- [ ] Shared Supabase client is reused, not reinstalled, when Realtime is combined
  with Supabase Auth (010) or Storage (014).

## Out of scope
Any realtime provider other than Supabase (PRD v1 scope is Supabase Realtime and
Convex only).
