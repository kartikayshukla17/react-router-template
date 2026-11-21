# create-rrstack

Scaffold a [React Router v8](https://reactrouter.com) app wired end to end to the
database, ORM, auth, storage, and realtime providers you choose — not a tutorial
stack, a real one: every combination generates, installs, typechecks, and builds.

This repository is the monorepo for `create-rrstack`: the CLI itself lives at
[`packages/create-rr-stack`](packages/create-rr-stack), the provider fragments it
assembles live at [`templates/`](templates), and the design behind all of it is in
[`PRD.md`](PRD.md) and [`tickets/`](tickets) (one ticket per vertical slice, in the
order they were built).

## Quickstart

```bash
npm create rrstack@latest
```

Answer a few prompts — database, ORM, auth, storage, realtime — and get a working
project. Prefer flags and zero prompts? See
[the CLI package's own README](packages/create-rr-stack/README.md#flags) for the
full non-interactive reference, including `--yes` and CI-friendly defaults.

## Provider matrix

Every row below is a real, generated, typechecked implementation — not a stub with
a TODO. Mix and match across layers freely; the resolver rejects an invalid
combination (e.g. Mongoose + Postgres) before anything is written, with a clear
reason.

| Layer | Providers |
| --- | --- |
| Database | PostgreSQL (Docker, Neon, or Supabase), SQLite, MongoDB (Docker or hosted), Convex |
| ORM | Drizzle, Prisma, Mongoose |
| Auth | Better Auth, Clerk, Supabase Auth, Firebase Auth, Convex Auth |
| Storage | S3 / Cloudflare R2 (presigned upload), Supabase Storage, Firebase Storage |
| Realtime | Supabase Realtime, Convex Realtime |

Convex is the one exception to "mix and match": choosing it at the database prompt
bundles auth and realtime automatically (database + auth + realtime come from the
same Convex deployment), and skips the ORM prompt entirely — Convex's own client is
the data layer.

## What you get

- A real [React Router v8](https://reactrouter.com) app (Vite, Tailwind), not a
  bare-bones stub.
- A working demo wired to whatever you picked: a protected `/dashboard`, `/notes`
  (database CRUD, with live updates across tabs if you picked a realtime provider),
  `/files` (storage upload/download), all strippable with `--no-example` if you just
  want the wiring.
- Every provider's own `getSession`/`requireUser`/`signOut`,
  `getUploadUrl`/`getDownloadUrl`/`remove`, or `subscribe`/`publish` behind the same
  fixed interface — swap providers later without rewriting every route that calls
  them.
- `npm install` and `git init` run for you (opt out with `--no-install`/`--no-git`),
  and a `.env.example` listing exactly which environment variables you need to fill
  in and where to find them.

## Repository layout

- [`packages/create-rr-stack`](packages/create-rr-stack) — the CLI: the resolver
  (compatibility rules, defaults), the scaffolder (file writes, structured merges),
  and every provider/glue manifest.
- [`templates/`](templates) — the actual files each provider/glue fragment overlays
  onto a generated project, plus the base React Router app everything starts from.
- [`PRD.md`](PRD.md) — the product requirements this project was built against.
- [`tickets/`](tickets) — one file per vertical slice, in build order; each names
  its scope and acceptance criteria.

## Contributing / developing locally

```bash
npm install
npm run build      # builds the CLI (packages/create-rr-stack/dist)
npm run test       # resolver/scaffolder/CLI unit tests, every workspace
npm run typecheck  # every workspace
```

See [`.github/workflows/`](.github/workflows) for the full CI matrix (generator
tests cross-platform, a representative set of real generated projects installed/
typechecked/built on every push, and a weekly job that keeps every pinned provider
dependency current without risking a silent break).

## License

MIT
