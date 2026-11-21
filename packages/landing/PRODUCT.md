# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript + Tailwind CSS, as a new `packages/landing` workspace in this monorepo. Delegated: proposed during brainstorming as the fit for the existing tooling (and for pikaicons/transitions-dev/stageshow), confirmed by the user when asked directly. Deploy target: Vercel.

## Users

Developers who land on this page from npm, GitHub, or search while deciding whether to scaffold their next React Router v8 project with `create-rr-stack` instead of hand-wiring a database/auth/storage stack themselves, or evaluating it against other `create-*` generators.

## Product Purpose

`create-rr-stack` is a `create-*` CLI (`npm create rr-stack@latest`) that scaffolds a React Router v8 app wired end-to-end to the database, ORM, auth, storage, and realtime providers the user picks. This page is the product's permanent marketing and docs-entry home — not a launch-day teaser — meant to convert a visiting developer into someone who runs the CLI.

## Positioning

Most `create-*` CLIs ask two or three questions and hand back a landing page with a TODO list; the real wiring work starts after the generator finishes. Every provider combination `create-rr-stack` generates is a complete, working implementation: it installs, typechecks, and builds for real, verified by CI on every push and by a weekly dependency-bump job. Every provider for a given layer implements the same fixed interface (`getSession`/`requireUser`/`signOut` for auth, `getUploadUrl`/`getDownloadUrl`/`remove` for storage, `subscribe`/`publish` for realtime), so swapping providers later doesn't require rewriting the routes that call them.

## Operating Context

Visitors arrive already knowing they want a React Router v8 app; they're deciding whether to trust this generator with their stack. The page's central artifact is the terminal command `npm create rr-stack@latest`, meant to be read, copied, and run. The provider matrix below is the core content, not an aside:

| Layer | Providers |
| --- | --- |
| Database | PostgreSQL (Docker, Neon, or Supabase), SQLite, MongoDB (Docker or hosted), Convex |
| ORM | Drizzle, Prisma, Mongoose |
| Auth | Better Auth, Clerk, Supabase Auth, Firebase Auth, Convex Auth |
| Storage | S3 / Cloudflare R2 (presigned upload), Supabase Storage, Firebase Storage |
| Realtime | Supabase Realtime, Convex Realtime |

Convex is the one exception to "mix and match": choosing it at the database prompt bundles auth and realtime automatically and skips the ORM prompt.

## Capabilities and Constraints

- The CLI also ships a full non-interactive mode (flags for every prompt, `--yes` for sane zero-account defaults, automatic package-manager detection) — built for scripts and agents as much as for a human typing into a terminal.
- `npm install` and `git init` run automatically after scaffolding (opt out with `--no-install`/`--no-git`), and a generated `.env.example` lists exactly which environment variables are needed and where to find them.
- The repo this page lives in (`packages/landing`) is a monorepo workspace; the CLI itself is `packages/create-rr-stack`, published to npm as `create-rr-stack` v1.0.0. The page is a separate static site, not served by the CLI.
- No hero photo/texture asset exists yet — the user will supply it later. Build the hero to take a full-bleed background image/placeholder now; do not treat the final image as decided.

## Evidence on Hand

- [README.md](../../README.md), [PRD.md](../../PRD.md), and [LAUNCH_POST.md](../../LAUNCH_POST.md) at the repo root hold the confirmed positioning copy, provider matrix, and draft launch messaging this page draws on.
- No customer names, testimonials, usage numbers, press, or pricing exist — none should be fabricated. GitHub star count / npm download count are real, pullable at build or runtime, but not yet wired to any source; treat as absent until the user provides a source.
- Repo: `github.com/kartikayshukla17/react-router-template` (from `packages/create-rr-stack/package.json`).

## Product Principles

- Prove the claim, don't just state it: every section should point at something concrete (a real command, a real matrix, a real CI guarantee) rather than generic trust language.
- The terminal command is the hero, not a footnote — it should be the most legible, most copyable thing on the page.
- Respect the "doesn't lie to you about being done" positioning: no vaporware polish (fake dashboards presented as real, invented metrics, placeholder testimonials).
- Developer-native tone: precise, a little dry, confident without hype-speak.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility (keyboard nav, contrast, reduced-motion support for the transition/motion work).
