import { defineProvider } from "../define-provider.js";

/**
 * Firebase Auth (https://firebase.google.com/docs/auth) — the third
 * no-ORM-required auth provider (after Clerk/009, Supabase Auth/010),
 * generating the exact combination asked about in grilling round 3:
 * Firebase Auth with Neon Postgres. `baas: "firebase"` reuses the shared
 * `firebase-client` fragment (`providers/baas/firebase-client.ts`) via the
 * same dedup mechanism Supabase Auth uses — installed once no matter how
 * many selected providers need it (today: just this one; ticket 014:
 * Firebase Storage too).
 *
 * No `deps` of its own: both `firebase` (browser client SDK, used by the
 * `/sign-in` route to actually authenticate) and `firebase-admin` (server
 * SDK, used by `app/server/auth.ts` to verify/revoke session cookies) are
 * pinned on the shared fragment, since its `app/lib/firebase-client.ts`/
 * `app/server/firebase-admin.ts` are what this provider's own files import.
 */
export const firebaseAuthProvider = defineProvider({
  layer: "auth",
  id: "firebase-auth",
  label: "Firebase Auth",
  baas: "firebase",
  requires: [],
  deps: {},
  devDeps: {},
  env: [],
  files: "providers/auth/firebase-auth",
  fileManifest: ["app/server/auth.ts"],
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
  nextSteps: [
    "Generate a service account key (Firebase console → Project settings → Service accounts) for the Admin SDK env vars.",
  ],
});
