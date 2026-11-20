import { defineProvider } from "../define-provider.js";

/**
 * Convex Auth (ticket 012) — always bundled with `database/convex` (never
 * selected alone; see `resolver/rules.ts`'s `convex-is-all-or-nothing`),
 * so this manifest's own `requires` is what makes a stray `--auth
 * convex-auth` without `--db convex` fail with a clear reason via the
 * generic `provider-requires-and-conflicts` rule.
 *
 * Needs no `deps` of its own: `convex` (the only package its files
 * import) is pinned on `database/convex`, which is always present
 * whenever this provider is. Ships the whole self-contained demo (home/
 * sign-in/dashboard/notes/routes.ts/auth.ts) the same way Clerk/Supabase
 * Auth/Firebase Auth do, plus `convex/auth.ts` — hand-rolled password
 * functions, not `@convex-dev/auth` (see that file's doc comment for why).
 */
export const convexAuthProvider = defineProvider({
  layer: "auth",
  id: "convex-auth",
  label: "Convex Auth",
  requires: [{ layer: "database", oneOf: ["convex"] }],
  deps: {},
  devDeps: {},
  env: [],
  files: "providers/auth/convex-auth",
  fileManifest: ["convex/auth.ts", "app/server/auth.ts"],
  // `app/routes.ts` itself is a structured-merge target (ticket 013's
  // `scaffolder/merge/routes.ts`), not a file this provider ships.
  // Demo routes (ticket 016's `--no-example`) are split out below: core
  // auth wiring ships either way, the demo UI only when included.
  demoFileManifest: [
    "app/routes/home.tsx",
    "app/routes/sign-in.tsx",
    "app/routes/dashboard.tsx",
    "app/routes/notes.tsx",
  ],
  demoRoutes: [
    { index: true, file: "routes/home.tsx" },
    { path: "sign-in", file: "routes/sign-in.tsx" },
    { path: "dashboard", file: "routes/dashboard.tsx" },
    { path: "notes", file: "routes/notes.tsx" },
  ],
  nextSteps: [],
});
