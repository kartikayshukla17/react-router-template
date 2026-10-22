# 018 — Weekly dependency-bump job

**Depends on:** 017
**Slice type:** vertical

## Summary
Keep pinned provider versions from going stale without risking a silent break, by
running the same combo matrix against the newest available versions on a schedule and
only proposing the bump if it passes.

## Scope
- GitHub Actions scheduled workflow (weekly), separate from the on-push CI.
- Resolves "latest" for every pinned dependency across every provider manifest,
  writes them into a scratch branch, runs the full 017 combo matrix against that
  branch.
- On success: opens a PR updating the manifests' pinned versions, with a summary of
  what moved.
- On failure: no PR; a summary comment/log states which combo and which dependency
  broke, so investigating a real breaking change doesn't start from zero.
- No automatic merge — a human reviews and merges the PR.

## Acceptance criteria
- [ ] The scheduled workflow runs weekly without manual triggering.
- [ ] A successful matrix run against bumped versions produces exactly one PR with a
  clear diff of old → new versions per provider.
- [ ] A failing matrix run produces no PR and a readable failure summary naming the
  combo and dependency.
- [ ] Manually triggering the workflow (workflow_dispatch) also works, for testing
  this ticket itself without waiting a week.

## Out of scope
Automatic merging, notifying anyone outside the PR itself (no Slack/email integration
in v1).
