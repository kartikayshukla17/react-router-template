# 017 — CI combo matrix + file-list snapshots

**Depends on:** 006, 007, 009, 011, 012 (needs a broad enough provider set to pick a
representative matrix from)
**Slice type:** vertical — this ticket's "feature" is trustworthy CI, delivered
end-to-end (workflow + matrix + snapshots + a failing-case test), not partial pieces.

## Summary
Automate what's been done manually since 003: generate a representative set of
combinations, install/typecheck/build each on ubuntu, snapshot the file list for every
valid combination, and run the generator tests cross-platform.

## Scope
- 8–10 representative combos chosen to cover every provider at least once: e.g.
  (Neon+Drizzle+Better Auth+S3), (Docker+Prisma+Clerk), (SQLite+Drizzle+Firebase
  Auth+Supabase Storage... only if Supabase Storage doesn't need the Supabase client,
  otherwise swap), (Mongo+Mongoose+Supabase Auth), (Convex bundle),
  (no database+no auth+no storage — the empty stack), etc.
- GitHub Actions workflow: generator unit tests (resolver, scaffolder) on
  ubuntu/macOS/Windows matrix; install+typecheck+build combos on ubuntu only, per PRD.
- Snapshot test: for every *valid* combination the resolver can produce (enumerate via
  the resolver itself, not a hand-written list), assert the generated file list
  matches a committed snapshot; update snapshots is a deliberate, reviewed step.
- A deliberately invalid combination (e.g. Mongoose+Postgres) is included as a test
  asserting the resolver rejects it — proves the matrix doesn't silently skip the
  filtering logic from earlier tickets.
- Collision test: two fragments writing the same path fails the CI run (exercises the
  scaffolder behavior from 001 inside real CI, not just a unit test).

## Acceptance criteria
- [ ] CI workflow runs on every push/PR.
- [ ] All 8–10 representative combos pass install, typecheck, build on ubuntu.
- [ ] Generator unit tests pass on ubuntu, macOS, and Windows.
- [ ] File-list snapshot test covers every combination the resolver reports as valid,
  and fails loudly (not silently) if the resolver's set of valid combinations grows
  without a matching snapshot.
- [ ] The deliberately invalid combo test fails fast with the resolver's error, not a
  build failure three steps later.
- [ ] A manufactured fragment path collision fails the CI run with a clear message.

## Out of scope
The weekly bump job (018) — this ticket is the matrix infrastructure the bump job will
reuse, not the bump job itself.
