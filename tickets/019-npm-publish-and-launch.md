# 019 — npm publish readiness + launch

**Depends on:** 017
**Slice type:** vertical

## Summary
Close the two open questions left in the PRD (package name, launch) and make the
package installable by the public for the first time.

## Scope
- Check npm availability in order: `create-rr-stack`, `create-react-router-stack`,
  `create-rr-app`. Use the first free name; rename the workspace package accordingly.
- Root README: what it is, quickstart (`npm create <name>@latest`), the full provider
  matrix table, link to PRD and tickets.
- `packages/create-rr-stack/README.md`: CLI-specific usage, full flag reference (from
  016), examples for a few representative combos.
- `npm publish` dry run (`--dry-run`) verified; real publish only on explicit
  confirmation — **no publish happens without the user's separate go-ahead**, same as
  no push happens without it.
- Version `1.0.0` tag, changelog entry.
- Draft build-in-public launch post (content only; posting it is the user's call, not
  this ticket's).

## Acceptance criteria
- [ ] Chosen package name is confirmed available on npm at time of publish.
- [ ] `npm publish --dry-run` from `packages/create-rr-stack` succeeds and shows the
  expected file list (no template source leaking in wrong paths, no `node_modules`).
- [ ] README quickstart command, copy-pasted fresh, produces a working project.
- [ ] A fresh clone + `npm create <published-name>@latest test-app` works from outside
  the monorepo (the real end-to-end test of "is this actually published correctly").
- [ ] Launch post draft exists as a file; nothing is posted or published without
  explicit confirmation from Kartikay.

## Out of scope
Actually posting the launch content, any marketing beyond the one draft post.
