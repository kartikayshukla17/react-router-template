# create-rrstack

Scaffold a [React Router v8](https://reactrouter.com) app wired end to end to the
database, ORM, auth, storage, and realtime providers you choose.

```bash
npm create rrstack@latest
```

Answers database → ORM → auth → storage → realtime, shows you the plan, then writes
the project, runs `npm install` and `git init`, and prints exactly which environment
variables to fill in and where to find them.

## Provider matrix

| Layer | Providers |
| --- | --- |
| Database | PostgreSQL (`--postgres-host docker\|neon\|supabase`), SQLite, MongoDB (`--mongo-host docker\|hosted`), Convex |
| ORM | Drizzle, Prisma, Mongoose |
| Auth | Better Auth, Clerk, Supabase Auth, Firebase Auth, Convex Auth |
| Storage | S3 / Cloudflare R2 (presigned upload), Supabase Storage, Firebase Storage |
| Realtime | Supabase Realtime, Convex Realtime |

Mix freely across layers — Supabase Auth with a Neon database, Firebase Storage with
Better Auth, and so on all work. Convex is the one bundle: picking it at the
database prompt pulls in Convex Auth and Convex Realtime automatically and skips
the ORM prompt, since Convex's own client is the data layer.

## Flags

Every prompt has a flag equivalent, so the exact same generator runs headless for
scripts and CI:

| Flag | Selects |
| --- | --- |
| `--db <value>` | `postgres`, `sqlite`, `mongodb`, or `convex` |
| `--postgres-host <value>` | `docker`, `neon`, or `supabase` (with `--db postgres`) |
| `--mongo-host <value>` | `docker` or `hosted` (with `--db mongodb`) |
| `--orm <value>` | `drizzle`, `prisma`, `mongoose`, or `none` |
| `--auth <value>` | `better-auth`, `clerk`, `supabase-auth`, `firebase-auth`, `convex-auth`, or `none` |
| `--storage <value>` | `s3-presigned`, `supabase-storage`, `firebase-storage`, or `none` |
| `--realtime <value>` | `supabase-realtime`, `convex`, or `none` |
| `--shadcn` | Include shadcn/ui |
| `--docker` | Include a `docker-compose.yml` for local services |
| `--no-example` | Strip the demo routes (`/`, `/sign-in`, `/dashboard`, `/notes`, `/files`) — core wiring (`auth.ts`/`db.ts`/`storage.ts`) still ships |
| `--no-install` | Skip running `npm install` (or the detected/specified package manager) |
| `--no-git` | Skip running `git init` |
| `--pm <npm\|pnpm\|yarn\|bun>` | Override package-manager auto-detection |
| `--yes` | Skip every remaining prompt, filling it in with the default below |

Non-interactive mode (plain, colorless output, no spinners) runs automatically
whenever `--yes` is passed or stdout isn't a TTY (e.g. piped to a file) — not just
when every flag is given. Any selection you *do* give as a flag skips just that one
prompt even without `--yes`; the rest are still asked interactively.

**`--yes` defaults** — every flag you don't specify falls back to the one
combination needing no third-party account or local daemon: SQLite + Drizzle, no
auth/storage/realtime. Choosing `--db postgres`/`--db mongodb` without a host still
defaults that host to `docker` (not Neon/Supabase, not a hosted hand-off) for the
same reason.

## Examples

```bash
# Fully interactive — just answer the prompts.
npm create rrstack@latest

# Zero prompts, the --yes baseline (SQLite + Drizzle).
npm create rrstack@latest my-app -- --yes

# A real-world stack, fully flagged.
npm create rrstack@latest my-app -- \
  --db postgres --postgres-host neon --orm drizzle \
  --auth better-auth --storage s3-presigned --yes

# Convex: one flag bundles database + auth + realtime.
npm create rrstack@latest my-app -- --db convex --yes

# CI/agent-friendly: no prompts, no install, no git.
npm create rrstack@latest my-app -- \
  --db sqlite --orm drizzle --auth clerk --yes --no-install --no-git
```

(The `--` before the flags keeps `npm create`/`npm init` from trying to parse them
itself; `npx create-rrstack@latest my-app --yes` doesn't need one.)

## What's in a generated project

- A real [React Router v8](https://reactrouter.com) app (Vite, Tailwind) — not a
  bare-bones stub.
- `app/server/auth.ts`, `app/server/db.ts`, `app/server/storage.ts`, `app/server/
  realtime.ts`: the fixed interface every provider implements
  (`getSession`/`requireUser`/`signOut`, `getUploadUrl`/`getDownloadUrl`/`remove`,
  `subscribe`/`publish`) — swap providers later without rewriting every route that
  calls them.
- A demo wired to whatever you picked (`--no-example` strips it, keeping the
  wiring): a protected `/dashboard`, `/notes` CRUD (live-updating across tabs if you
  picked a realtime provider), `/files` upload/download.
- `.env.example` listing exactly which environment variables you need and where to
  find each one; `rr-stack.json` recording what you chose.

## Developing this CLI

```bash
npm run build       # tsdown, then copies templates/ into dist/templates/
npm run test        # vitest — resolver, scaffolder, CLI flag parsing
npm run typecheck
```

See the [monorepo README](https://github.com/kartikayshukla17/react-router-template#readme)
for the full picture: the PRD this was built against, the ticket-by-ticket build
log, and the CI setup.

## License

MIT
