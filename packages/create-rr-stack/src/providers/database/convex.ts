import { defineProvider } from "../define-provider.js";

/**
 * Convex (https://convex.dev) — ticket 012, resolving the PRD's open
 * question of whether Convex is one bundle shortcut or three independent
 * layer choices: **three choices in the prompt list, pre-selected
 * together.** Picking Convex at the database prompt (`resolve()`'s
 * `selectProviders()`) auto-adds `auth/convex-auth` and `realtime/convex`
 * too, with no ORM prompt at all — Convex's own client is the data layer.
 * `resolver/rules.ts`'s `convex-is-all-or-nothing` rule is what makes this
 * a hard invariant (a conflicting `--auth`/`--orm` is rejected, not
 * silently overridden) rather than just a CLI-flow convention.
 *
 * Ships `convex/schema.ts` (the `users`/`sessions`/`notes`/`events`
 * tables — all four, since Convex has exactly one schema file; `auth/
 * convex-auth` and `realtime/convex` own the auth/realtime concepts those
 * tables back, not this file's authorship) and `convex/notes.ts` (the
 * demo's query/mutations) at the project root — Convex's own fixed
 * project layout, a sibling of `app/`, not nested under it — plus
 * `app/server/db.ts`, which every other provider's `/notes` demo route
 * reaches the database through.
 */
export const convexDatabaseProvider = defineProvider({
  layer: "database",
  id: "convex",
  label: "Convex",
  requires: [],
  deps: {
    convex: "^1.51.0",
  },
  devDeps: {},
  env: [
    {
      name: "CONVEX_DEPLOYMENT",
      description: "Identifies which Convex deployment this project talks to",
      whereToFind: "Written automatically by `npx convex dev` on first run — no manual setup",
      secret: false,
    },
    {
      name: "VITE_CONVEX_URL",
      description: "Your Convex deployment's URL (exposed to the browser and read on the server)",
      whereToFind: "Written automatically by `npx convex dev` into .env.local on first run",
      secret: false,
    },
  ],
  files: "providers/database/convex",
  fileManifest: ["convex/schema.ts", "convex/notes.ts", "app/server/db.ts"],
  nextSteps: [
    "Run `npx convex dev` once to log in (or create an account), provision a deployment, and write CONVEX_DEPLOYMENT/VITE_CONVEX_URL into .env.local — the generated convex/_generated/ types this project imports don't exist until then.",
  ],
});
