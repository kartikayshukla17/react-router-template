# Changelog

All notable changes to `create-rr-stack` are documented here. See
[`tickets/`](../../tickets) for the full build log, one file per entry below.

## 1.0.0

Initial public release.

### Database

- PostgreSQL, via Docker (local), Neon (hosted), or Supabase (hosted).
- SQLite (local file, zero accounts, zero Docker).
- MongoDB, via Docker (local) or a hosted cluster (e.g. Atlas).
- Convex — bundles database, auth, and realtime together; picking it skips the ORM
  prompt and pre-fills auth/realtime, since mixing Convex with another layer's
  provider isn't supported.

### ORM

- Drizzle (every Postgres host, plus SQLite).
- Prisma (every Postgres host, plus SQLite).
- Mongoose (MongoDB only).

### Auth

- Better Auth (requires an ORM + SQL database).
- Clerk, Supabase Auth, Firebase Auth, Convex Auth — each independent of the
  database/ORM layer; pair with any database choice, or none at all.

### Storage

- S3 / Cloudflare R2, via presigned uploads with SHA-256 checksum validation and an
  orphaned-upload cleanup script.
- Supabase Storage, Firebase Storage — each reusing their respective shared BaaS
  client fragment when it's already installed for auth or the database.

### Realtime

- Supabase Realtime (Broadcast channels — works with any database, not just a
  Supabase-hosted one).
- Convex Realtime (bundled with the Convex database/auth combination).

### CLI

- Interactive prompts (database → ORM → auth → storage → realtime → confirm), with
  a plan summary before anything is written.
- Full non-interactive mode: a flag for every prompt, `--yes` for the documented
  zero-account defaults, automatic package-manager detection
  (`npm`/`pnpm`/`yarn`/`bun`), plain colorless output on a non-TTY stdout.
- `--no-example` strips the generated demo routes while keeping the underlying
  provider wiring; `npm install`/`git init` run automatically unless
  `--no-install`/`--no-git` is passed.
- `rr-stack.json` records the CLI version and every selection made.

### CI

- Generator unit tests (resolver, scaffolder, CLI flag parsing) cross-platform
  (ubuntu/macOS/Windows) on every push.
- A representative set of combinations installed, typechecked, and built for real
  on every push, covering every database host, ORM, auth provider, storage
  provider, and realtime provider at least once.
- A file-list snapshot across every valid combination the resolver can produce.
- A weekly job that resolves the latest version of every pinned provider
  dependency, verifies the bump against the same matrix, and opens a PR only if it
  passes.
