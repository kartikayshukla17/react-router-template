import { defineProvider } from "../define-provider.js";

/**
 * Convex Realtime (ticket 012) — like `auth/convex-auth`, always bundled
 * with `database/convex` (see `resolver/rules.ts`'s
 * `convex-is-all-or-nothing`); this provider's own `requires` rejects a
 * stray `--realtime convex` without `--db convex` via the generic
 * `provider-requires-and-conflicts` rule.
 *
 * No `deps` of its own — `convex` is pinned on `database/convex`. Ships
 * `convex/events.ts` (the generic channel/payload event log
 * `subscribe`/`publish` read and write) and `app/server/realtime.ts`.
 */
export const convexRealtimeProvider = defineProvider({
  layer: "realtime",
  id: "convex",
  label: "Convex Realtime",
  requires: [{ layer: "database", oneOf: ["convex"] }],
  deps: {},
  devDeps: {},
  env: [],
  files: "providers/realtime/convex",
  fileManifest: ["convex/events.ts", "app/server/realtime.ts"],
  nextSteps: [],
});
