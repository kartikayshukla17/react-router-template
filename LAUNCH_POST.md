<!--
DRAFT ONLY. This is content for a "build in public" launch post, written
for ticket 019's acceptance criterion that a draft exists as a file.
Nothing here gets posted anywhere without Kartikay's explicit go-ahead —
not to Twitter/X, not to a blog, not anywhere else. Delete this comment
block before posting; it's not part of the post itself.
-->

# Launch post draft

## Short version (Twitter/X thread)

**1/**
Shipped `create-rrstack`: a `create-*` CLI for React Router v8 that actually wires
up the stack you pick — database, ORM, auth, storage, realtime — instead of handing
you a landing page and a TODO list.

```
npm create rrstack@latest
```

**2/**
Every combination is real. Postgres (Docker, Neon, or Supabase) or SQLite or
MongoDB, with Drizzle, Prisma, or Mongoose. Better Auth, Clerk, Supabase Auth,
Firebase Auth, or Convex Auth. S3/R2, Supabase, or Firebase for storage. Supabase
or Convex for realtime. Mix across layers — Supabase Auth with a Neon database,
Firebase Storage with Better Auth — and it still generates, installs, typechecks,
and builds.

**3/**
The one exception: Convex. Pick it and it bundles database + auth + realtime
together automatically, skips the ORM prompt, and the resolver rejects mixing it
with anything else — explicitly, with a clear error, not a silent "pick one and
hope."

**4/**
Every provider implements the same fixed interface: `getSession`/`requireUser`/
`signOut` for auth, `getUploadUrl`/`getDownloadUrl`/`remove` for storage,
`subscribe`/`publish` for realtime. Swap Clerk for Supabase Auth later and your
routes don't change.

**5/**
Full non-interactive mode too — a flag for every prompt, `--yes` for sane
zero-account defaults, automatic package-manager detection. Built for scripts and
agents as much as for typing into a terminal.

**6/**
CI runs the real thing: a representative combo matrix installs/typechecks/builds
on every push, a snapshot test covers every valid combination the resolver can
produce, and a weekly job bumps every pinned dependency and only opens a PR if the
bump actually passes.

**7/**
Built it ticket by ticket, in public, as vertical slices — each one a real,
demoable increment, not "finish the resolver for every layer" as an isolated pass.
The whole build log is in the repo if you want to see how a 5-layer,
multi-provider generator actually gets built: [repo link]

---

## Longer version (blog post / README-style announcement)

### `create-rrstack`: a React Router scaffold that doesn't lie to you about being done

Most `create-*` CLIs ask you two or three questions and hand you a landing page.
The real work — wiring up a database, picking an ORM, getting auth to actually
protect a route, getting file uploads to actually upload — starts after the
generator finishes.

`create-rrstack` tries to close that gap. It's a scaffold for
[React Router v8](https://reactrouter.com) apps where every provider you can pick
is a complete, working implementation, not a stub:

- **Database**: PostgreSQL (Docker, Neon, or Supabase), SQLite, MongoDB (Docker or
  hosted), or Convex.
- **ORM**: Drizzle, Prisma, or Mongoose.
- **Auth**: Better Auth, Clerk, Supabase Auth, Firebase Auth, or Convex Auth.
- **Storage**: S3/Cloudflare R2 (presigned uploads with checksum validation),
  Supabase Storage, or Firebase Storage.
- **Realtime**: Supabase Realtime or Convex Realtime.

Pick any combination across those layers — Supabase Auth with a Neon database and
Firebase Storage, say — and it generates, installs, typechecks, and builds. The one
deliberate exception is Convex: since Convex bundles its own database, auth, and
realtime together, picking it locks the other two layers to match, with a clear
resolver error if you try to mix it with something else.

Every provider for a given layer implements the exact same interface:
`getSession`/`requireUser`/`signOut` for auth, `getUploadUrl`/`getDownloadUrl`/
`remove` for storage, `subscribe`/`publish` for realtime. Start with Clerk, decide
later you want Supabase Auth instead — your routes don't need to change, just the
one flag you pass at generation time.

```bash
npm create rrstack@latest
```

answers a handful of prompts (or skip them entirely with `--yes` and flags — it's
built to run headless for CI and agents too), shows you the plan, then writes the
project, runs `npm install` and `git init`, and tells you exactly which environment
variables to fill in and where each one comes from.

It's backed by real CI: a representative combination of providers is installed,
typechecked, and built for real on every push; a snapshot test covers every valid
combination the resolver will produce at all; and a weekly job resolves the latest
version of every pinned dependency, verifies the bump against that same matrix, and
only opens a PR if it actually passes.

The whole thing was built in public, ticket by ticket, as vertical slices — each
one a real, demoable increment rather than "finish the resolver for every layer in
isolation." The PRD and the full ticket-by-ticket build log are in the repo if
you're curious how a generator with this many moving parts actually gets built:
**[repo link]**

```bash
npm create rrstack@latest
```
