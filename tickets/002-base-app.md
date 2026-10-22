# 002 — Base React Router v8 app

**Depends on:** 000
**Slice type:** horizontal (every fragment overlays onto this; it has no independent
user-facing slice of its own)

## Summary
Fetch the official React Router v8 framework-mode template (do not write it from
memory) and turn it into the real, runnable, typechecked base that lives at
`templates/base/`.

## Scope
- Scaffold via the official `create-react-router` (or equivalent) generator at the
  pinned version matching React Router 8.5.0.
- Add Tailwind v4.
- Add Biome, replacing any default ESLint/Prettier setup, with lint + format scripts.
- Add the four fixed server-interface files as empty-but-typed stubs, so later
  provider fragments have a known seam to slot into:
  `app/server/db.ts`, `app/server/auth.ts`, `app/server/storage.ts`,
  `app/server/realtime.ts` — each exporting a typed interface with a
  "not configured" default implementation that throws a clear error.
- `package.json` `engines.node >= 22.22.0`.
- Root-level README placeholder (filled properly in 019).

## Acceptance criteria
- [ ] `npm install && npm run typecheck && npm run build` succeed inside
  `templates/base/` on its own, with no provider selected.
- [ ] `npm run dev` serves the default route.
- [ ] Biome lint passes with zero errors on a clean checkout.
- [ ] The four `app/server/*.ts` stub files exist, are imported by nothing yet, and
  each throws a readable "no <layer> provider configured" error if called.
- [ ] CI (added here, minimal) runs install + typecheck + build for `templates/base/`
  on ubuntu on every push that touches it.

## Out of scope
Any provider fragment, shadcn/ui, Dockerfile — those arrive with the tickets that need
them (003 for the first slice, 017 for the full CI matrix).
