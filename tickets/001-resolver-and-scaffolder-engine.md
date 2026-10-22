# 001 — Resolver + scaffolder engine, proven on one provider

**Depends on:** 000
**Slice type:** vertical (engine built and tested against one real provider, not
against abstract layers with nothing to write to disk)

## Summary
Build the two deep modules the whole CLI depends on — the stack resolver and the
scaffolder — and prove both work by taking a single real provider (Docker Postgres,
no ORM, no auth) all the way from "selections" to "files written to a temp directory,"
entirely in memory for the test.

## Scope
- `resolver/`: `options(layer, partial): Option[]`, `resolve(selections): Plan | Errors`.
  Table-driven rule format for `requires` / `conflicts`; starts with one rule (Postgres
  host) and one provider (`database/postgres` with `host: docker`).
- `providers/`: `defineProvider({...})` shape (see PRD §8–9). One real manifest:
  `database/postgres-docker`.
- `scaffolder/`: `scaffold(plan, targetDir, fs): Result`. Takes an injectable `fs`
  interface (`readFile`, `writeFile`, `mkdir`, `exists`) with a real-fs adapter and an
  in-memory adapter.
- Merge helpers (stubs are fine here, filled out as more providers land in 004+):
  `mergePackageJson`, `mergeEnvExample`.
- Path-collision detection: two fragments claiming the same output path fails
  `scaffold()` with a named error, doesn't silently overwrite.

## Acceptance criteria
- [ ] `resolve({ database: "postgres", postgresHost: "docker" })` returns a `Plan`
  containing exactly the `postgres-docker` provider.
- [ ] `resolve({})` returns a `Plan` with no providers and no errors (empty stack is
  valid).
- [ ] An unresolvable requirement produces a typed `Errors` value, not a thrown
  exception.
- [ ] `scaffold()` against the in-memory fs writes the provider's files, merges a stub
  `package.json`, and returns a `Result` listing every path it wrote.
- [ ] Deliberately colliding two fragments on the same path fails `scaffold()` with a
  clear error naming both fragments and the path.
- [ ] All of the above is covered by Vitest table tests; no disk I/O in the resolver
  or scaffolder tests.

## Out of scope
Any other provider, the CLI shell/prompts, the base app.
