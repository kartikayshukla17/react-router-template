# PRD: create-rr-stack — React Router v8 Starter CLI

Status: Draft v1 · 2026-10-23 · Owner: Kartikay Shukla
Repo: github.com/kartikayshukla17/react-router-template (nothing pushed yet)

---

## 1. Overview

**Name:** `create-rr-stack` (working name; npm availability of `create-rr-stack`, `create-react-router-stack`, `create-rr-app` is checked in that order before publishing).

**Problem.** Starting a React Router v8 app with a real backend means hand-wiring a database, an ORM, auth, file storage and realtime, and then re-wiring when one choice changes. Existing scaffolders (Better-T-Stack, create-t3-app) cover other frameworks, and none treat BaaS products as mix-and-match parts of the stack.

**Solution.** A terminal CLI (`npm create rr-stack@latest`) that asks which provider fills each layer (database, ORM/ODM, auth, storage, realtime), including picking individual parts of a BaaS, and generates a working React Router v8 app with those choices wired together.

**AI Build Summary.**
> Build a TypeScript npm workspace containing (1) a CLI package `create-rr-stack` using `@clack/prompts`, flags and a `--yes` mode; (2) a real, runnable React Router v8 framework-mode base app; (3) provider fragments that overlay the base. The CLI is made of three deep modules: a pure stack resolver, a provider manifest format, and a scaffolder that takes an injectable filesystem. Generated routes import only `app/server/{db,auth,storage,realtime}`; each provider supplies an adapter behind those fixed interfaces. Node >= 22.22.0 is required and checked at CLI startup. No telemetry, no outbound API calls from the CLI, MIT licence, TypeScript only. Do not push to any remote.

---

## 2. Goals & Success Metrics

**Primary goal.** Any valid combination of choices yields a project that installs, typechecks, builds and runs the demo with no manual edits except filling env vars.

**Success metrics**
- 100% of the CI combo matrix (8–10 representative combos) passes install, typecheck and build on ubuntu.
- Prompt-to-running-dev-server in under 60 seconds of user time (excluding network install).
- Snapshot test of the generated file list passes for every valid combination.

**Anti-goals**
- Not a general-purpose framework starter. React Router v8 framework mode only.
- Not a project manager: no `add`/upgrade command in v1 (the `rr-stack.json` record only makes one possible later).
- Not an account provisioner: the CLI never creates Neon, Supabase, Firebase or Clerk projects.

---

## 3. Scope & Constraints

**In scope (v1)**
- Layers and providers:
  - Database: Postgres (host: Docker, Neon, Supabase), SQLite, MongoDB, Convex
  - ORM/ODM: Drizzle, Prisma, Mongoose, none
  - Auth: Better Auth, Clerk, Supabase Auth, Firebase Auth, Convex Auth, none
  - Storage: S3/R2 presigned upload, Supabase Storage, Firebase Storage, none
  - Realtime: Supabase Realtime, Convex, none
- Per-layer independent selection (e.g. Firebase Auth + Neon Postgres + Drizzle).
- Dynamic prompt filtering: invalid options are never offered, with a hint explaining why.
- Interactive mode, full flag mode, and `--yes` defaults mode.
- Package manager auto-detection (npm, pnpm, yarn, bun), `--no-install`, git-init prompt.
- Tailwind v4 always on; Biome for lint/format; shadcn/ui as an optional extra; optional Dockerfile.
- Demo code on by default (`--no-example` strips it): protected `/dashboard` (auth), notes list with create/delete (db), upload form (storage, when picked).
- Local services: `docker-compose.yml` for Docker Postgres/Mongo; `db:push`, `db:studio`, `db:seed` scripts.
- Per-provider "next steps" checklist printed at the end.
- `rr-stack.json` written into each generated project (CLI version + choices).
- CI: generator tests on ubuntu/macOS/Windows; install+typecheck+build combos on ubuntu; weekly dependency-bump job gated on the matrix.

**Out of scope (v1)**
- Firestore, Appwrite, Pocketbase, Auth.js, uploadthing, MySQL.
- Cloudflare/Vercel adapters (Node server only, plus Dockerfile).
- Runtime E2E tests (Playwright), hitting real databases or BaaS in CI.
- JavaScript (non-TS) output, telemetry, `add`/upgrade commands.
- User-sync table for third-party auth providers (provider user id stored as text only).

**Technical constraints**
- Node >= 22.22.0 (React Router 8.5.0 engine requirement). CLI exits at startup with a clear upgrade message below that; generated `package.json` sets the same `engines`.
- React Router 8.5.0, React >= 19.2.7, Vite as shipped by the official v8 template (base is derived from it, not written from memory).
- Provider dependency versions are pinned in manifests.
- Cross-platform path handling (Windows included).
- No network calls from the CLI beyond the package manager's install.
- Licence MIT.

---

## 4. Jobs to Be Done

| Priority | Job |
|---|---|
| 1 | When I start a new React Router v8 project, I want to choose my database, auth and storage once, so I can skip hours of wiring and start on product code. |
| 2 | When I already like a specific BaaS feature (e.g. Firebase Auth) but want a different database (e.g. Neon), I want to mix providers per layer, so I'm not forced into an all-or-nothing platform. |
| 3 | When an AI agent or CI script scaffolds projects, I want every prompt available as a flag, so the run is deterministic and non-interactive. |
| 4 | When I swap a provider later, I want routes that don't know which provider they use, so the change touches one file. |

---

## 5. User Stories

| ID | Role | Action | Benefit | JTBD |
|---|---|---|---|---|
| US1 | Developer | run `npm create rr-stack@latest` and answer prompts | get a configured project | J1 |
| US2 | Developer | pick a provider independently for each layer | mix e.g. Firebase Auth with Neon | J2 |
| US3 | Developer | see only valid options after each answer, with a reason for what's hidden | avoid broken combinations | J1, J2 |
| US4 | Script/agent | pass all choices as flags with `--yes` | scaffold non-interactively | J3 |
| US5 | Developer on old Node | get a clear message to upgrade | not hit cryptic install errors | J1 |
| US6 | Developer | open the generated demo and see auth/db/storage working | verify my stack immediately | J1 |
| US7 | Developer | read a per-provider checklist of env vars and where to find them | finish setup without hunting docs | J1 |
| US8 | Developer | replace a provider by swapping one `app/server/*` file | change my mind later | J4 |
| US9 | Maintainer | have CI generate and build representative combos | never ship a broken combination | — |

---

## 6. Proposed Experience

**Design direction.** A calm, fast, single-column terminal flow (clack style): one question at a time, a recommended default pre-selected, and a final summary screen showing the full plan before any file is written.

**Primary flow**
1. Node version check. Below 22.22.0: print required vs current version and upgrade hint (nvm/fnm/brew), exit code 1.
2. Project name and directory (rejects non-empty existing directory unless confirmed).
3. Layer prompts in order: Database (+ host if Postgres) → ORM/ODM → Auth → Storage → Realtime. Each prompt receives the answers so far; options come from the resolver.
4. Extras: shadcn/ui, Dockerfile, demo code, git init, install dependencies.
5. Plan summary and confirm.
6. Scaffold, install (unless `--no-install`), print next steps checklist.

**States**
- Non-empty target dir: confirm/overwrite/cancel.
- Invalid flag combination: exit 1 listing the conflict and valid alternatives.
- Ctrl+C at any prompt: clean exit, nothing written (scaffolding happens only after confirm).
- Install failure: project stays generated; print the manual command to retry.
- Unsupported package manager version: warn, continue with npm.

**Accessibility.** Prompts are keyboard-only; every prompt has a flag equivalent; no colour-only meaning (symbols plus text); `NO_COLOR` respected; plain output when stdout is not a TTY.

**Generated demo.** Minimal, unbranded UI (Tailwind). Routes: `/` (landing), `/sign-in`, `/dashboard` (protected), `/notes` (db), `/files` (storage). Each only appears if its layer was chosen.

---

## 7. Component Inventory

CLI side

| Component | Type | Description | Stories |
|---|---|---|---|
| Stack resolver | Module (pure) | Compatibility rules, defaults, prompt options, plan | US2, US3, US4 |
| Provider manifest | Data format | Declares layer, requires, conflicts, deps, env, files, next steps | US2, US7 |
| Scaffolder | Module | Overlays files, merges shared files, produces result | US1, US9 |
| Merge helpers | Internal | `package.json`, `.env.example`, `tsconfig` structured mergers | US1 |
| CLI shell | Thin | clack prompts, flags, `--yes`, summary | US1, US4 |
| Node guard | Function | Version check + upgrade message | US5 |
| FS adapters | Seam | Real fs, in-memory fs | US9 |

Generated app side

| Component | Type | Description | Stories |
|---|---|---|---|
| `app/server/db.ts` | Interface | Typed db access for the chosen ORM | US6, US8 |
| `app/server/auth.ts` | Interface | `getSession`, `requireUser`, `signOut` | US6, US8 |
| `app/server/storage.ts` | Interface | `getUploadUrl`, `getDownloadUrl`, `remove` | US6, US8 |
| `app/server/realtime.ts` | Interface | `subscribe`, `publish` | US6, US8 |
| Sign-in route | Page | Provider-specific sign-in UI | US6 |
| Dashboard / Notes / Files routes | Pages | Demo routes | US6 |

---

## 8. Data Models

```typescript
type Layer = "database" | "orm" | "auth" | "storage" | "realtime";

interface Provider {
  layer: Layer;
  id: string;                       // e.g. "neon", "drizzle", "firebase-auth"
  label: string;
  baas?: "supabase" | "firebase" | "convex";   // shared client installed once
  requires?: Constraint[];          // e.g. orm requires database in [postgres, sqlite]
  conflicts?: Constraint[];
  deps: Record<string, string>;     // pinned versions
  devDeps?: Record<string, string>;
  env: EnvVar[];
  files: string;                    // folder of files to overlay
  nextSteps: string[];
}

interface Glue {                    // cross-layer pair, e.g. better-auth + drizzle
  between: [providerId: string, providerId: string];
  files: string;
  deps?: Record<string, string>;
}

interface EnvVar { name: string; description: string; whereToFind: string; secret: boolean }

type Selections = Partial<Record<Layer, string>> & {
  postgresHost?: "docker" | "neon" | "supabase";
  extras: { shadcn: boolean; docker: boolean; example: boolean };
};

interface Plan {
  providers: Provider[];
  glue: Glue[];
  installOrder: string[];
  env: EnvVar[];
  nextSteps: string[];
}

interface ProjectRecord {           // rr-stack.json in generated project
  cliVersion: string;
  selections: Selections;
  generatedAt: string;              // ISO8601
}
```

---

## 9. Interface Surface (deep modules)

Depth principle: each module is a small interface in front of a large implementation, and the interface is what tests exercise. A module that fails the deletion test (e.g. a standalone "prompts" module) is not built.

| Module | Interface | Hides |
|---|---|---|
| Stack resolver | `options(layer, partial): Option[]` · `resolve(selections): Plan \| Errors` | Compatibility rules, defaults, glue selection, BaaS client dedup, install order |
| Scaffolder | `scaffold(plan, targetDir, fs): Result` | Copy, overlay, structured merges, collision detection, notes |
| Provider (data) | `defineProvider({...})` | Nothing; it is the shared shape for all adapters |
| CLI shell | `run(argv, env)` | Parsing only; deliberately thin |

**CLI flags:** `--db`, `--postgres-host`, `--orm`, `--auth`, `--storage`, `--realtime`, `--shadcn`, `--docker`, `--no-example`, `--no-install`, `--no-git`, `--pm <npm|pnpm|yarn|bun>`, `--yes`.

**Generated app interfaces (fixed across providers)**
- `auth`: `getSession(request) → Session | null`, `requireUser(request) → User` (throws redirect), `signOut(request) → Response`.
- `storage`: `getUploadUrl(key, contentType) → {url, headers}`, `getDownloadUrl(key) → string`, `remove(key) → void`.
- `realtime`: `subscribe(channel, handler) → unsubscribe`, `publish(channel, payload) → void`.
- `db`: exports the ORM client (or the Convex/Mongo client); schema file lives beside it.

Merge discipline: fragments add whole files in their own slots or change shared files through structured mergers only. No string patching of source; a path collision between fragments fails the build.

**Cross-layer glue:** pair fragments (e.g. `better-auth+drizzle`, `better-auth+prisma`) selected automatically by the resolver. Better Auth requires an ORM and a SQL database. Firebase, Clerk, Supabase and Convex auth need nothing from the database layer.

---

## 10. State Management Map

| State | Location | Persistence | Notes |
|---|---|---|---|
| Prompt answers | In-memory in CLI | Session | Held until confirm, then written as `rr-stack.json` |
| Plan | Resolver output | None | Pure function of selections |
| Generated project record | `rr-stack.json` | Persistent | Enables a future `add` command |
| Env values | `.env` / `.env.example` in generated app | Persistent | CLI writes only the example file |
| Auth session (generated app) | Provider-defined cookie/token | Session | Hidden behind `app/server/auth.ts` |

---

## 11. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| CLI language | TypeScript, ESM | Same language as the output; typed manifests |
| Prompts | `@clack/prompts` 1.8.x | Small, good UX, supports cancel handling |
| CLI build | tsdown | Fast bundling for a single publishable file |
| Tests | Vitest | Table tests for resolver, in-memory fs for scaffolder |
| Monorepo | npm workspaces | Matches the installed toolchain; no pnpm/bun on dev machine |
| Base app | React Router 8.5.0 framework mode, Tailwind v4, Biome | Official v8 template as the base |
| CI | GitHub Actions | OS matrix + weekly bump job |

---

## 12. Suggested File Structure

```
react-router-template/
├── PRD.md
├── package.json                 # npm workspaces
├── packages/
│   └── create-rr-stack/
│       ├── src/
│       │   ├── cli.ts           # thin shell: flags + clack
│       │   ├── node-guard.ts
│       │   ├── resolver/        # options(), resolve(), rules
│       │   ├── scaffolder/      # scaffold(), mergers, fs adapters
│       │   └── providers/       # defineProvider manifests (index per layer)
│       └── test/
├── templates/
│   ├── base/                    # runnable RR v8 app (typechecked in CI)
│   ├── providers/<layer>/<id>/  # file fragments
│   └── glue/<a>+<b>/
├── tests/                       # generation matrix + file-list snapshots
└── .github/workflows/           # ci.yml, weekly-bump.yml
```

---

## 13. Acceptance Criteria

**US1 — Interactive scaffold**
- [ ] Running the CLI and answering prompts creates a directory with the chosen providers wired.
- [ ] No files are written before the confirm step.
- [ ] Ctrl+C at any prompt exits cleanly with nothing on disk.
- [ ] `rr-stack.json` is written with CLI version and selections.

**US2 — Per-layer mixing**
- [ ] Firebase Auth + Neon + Drizzle generates, installs, typechecks and builds.
- [ ] Supabase Auth + Neon Postgres + Prisma generates and builds.
- [ ] A BaaS client and its env vars appear once even when two layers use it.

**US3 — Filtering**
- [ ] Mongoose is not offered unless database is MongoDB.
- [ ] No ORM prompt is shown when database is Convex.
- [ ] Better Auth is not offered without an ORM and a SQL database.
- [ ] Each hidden option set is accompanied by a one-line reason.

**US4 — Non-interactive**
- [ ] `--yes` with all layer flags runs with no prompts and exit code 0.
- [ ] Missing or invalid flag combos exit 1 and list valid alternatives.
- [ ] Output is plain text when stdout is not a TTY.

**US5 — Node guard**
- [ ] On Node < 22.22.0 the CLI prints required and current versions plus an upgrade hint, and exits 1 before any prompt.
- [ ] Generated `package.json` contains `engines.node >= 22.22.0`.

**US6 — Demo**
- [ ] `/dashboard` redirects to sign-in when unauthenticated.
- [ ] Notes can be created and deleted when a database is chosen.
- [ ] Upload form works against the chosen storage when picked.
- [ ] `--no-example` removes demo routes and the generated app still builds.

**US7 — Next steps**
- [ ] Output lists every required env var, what it is, and where to find it, per chosen provider.
- [ ] The CLI makes no outbound request other than the package manager install.

**US8 — Swappable providers**
- [ ] No demo route imports a provider SDK directly; only `app/server/*`.

**US9 — CI**
- [ ] Generator tests pass on ubuntu, macOS, Windows.
- [ ] 8–10 representative combos pass install, typecheck, build on ubuntu.
- [ ] Two fragments writing the same path fails the test run.
- [ ] Weekly bump job opens a PR only when the matrix passes with newest versions.

---

## 14. Open Questions & Risks

- **Risk:** Node >= 22.22.0 excludes people on older 22.x LTS. *Mitigation:* clear upgrade message (US5); this is a React Router v8 requirement, not ours.
- **Risk:** Combination explosion makes bugs hide in untested pairs. *Mitigation:* representative CI matrix plus file-list snapshots for all valid combos; glue fragments are explicit.
- **Risk:** Provider SDK majors break fragments. *Mitigation:* pinned versions and the gated weekly bump job.
- **Risk:** The common-interface adapters (`auth`, `storage`, `realtime`) lose provider-specific features. *Mitigation:* adapters expose the minimal shared surface; provider-specific code can still be used in non-demo files.
- **Resolved (ticket 019):** Final npm package name is `create-rr-stack` — confirmed available on the npm registry (the first choice in the priority order; `create-react-router-stack` and `create-rr-app` were also free, but didn't need to be used).
- **Correction (2026-11-21):** `create-rr-stack` turned out to be registered on the npm registry by an unrelated project (a React Router + Rust/Axum scaffolder, no connection to this one) — never actually reachable under this name, whatever ticket 019's check found at the time. Renamed to `create-rrstack` (confirmed free); the package directory stays `packages/create-rr-stack` since renaming it isn't needed to fix this.
- **Resolved (ticket 012):** Convex (database + auth + realtime in one) appears as three choices in the prompt list, pre-selected together — picking Convex at the database prompt skips the ORM prompt and pre-fills auth/realtime as Convex, with the skip reason shown; the resolver rejects any other combination (Convex is all-or-nothing across those three layers, not independently mixable).
- **Tradeoff:** No user-sync table for third-party auth in v1; app tables reference the provider's user id as text.
- **Tradeoff:** No Cloudflare/Vercel adapters in v1; Node server only.

---

## 15. Rollout & Next Steps

**MVP build order (test-first at each step)**
1. Stack resolver with table-driven tests.
2. Scaffolder with the in-memory fs.
3. Base app from the official RR v8 template.
4. One end-to-end slice: Postgres on Neon, Drizzle, Better Auth.
5. Remaining providers, one layer at a time.
6. CI matrix, then the weekly bump job.

**Phase 2+**
- Auth.js, Appwrite, Pocketbase, MySQL, Firestore, uploadthing.
- Cloudflare and Vercel targets.
- `add` command and upgrade checks using `rr-stack.json`.
- Playwright smoke tests per combo.
- Build-in-public launch post.

**Sign-off:** Kartikay (product + engineering + design).

**Next steps**
1. Confirm this PRD — *Owner: Kartikay*
2. Verify npm name availability — *Owner: Claude, before first publish*
3. Start step 1 of the build order only after explicit go-ahead. Nothing is pushed to any remote without separate approval.
