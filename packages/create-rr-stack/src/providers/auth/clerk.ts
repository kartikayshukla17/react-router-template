import { defineProvider } from "../define-provider.js";

/**
 * Clerk (https://clerk.com) — the first third-party, no-ORM-required auth
 * provider (ticket 009), proving the PRD §9 rule that "Firebase, Clerk,
 * Supabase and Convex auth need nothing from the database layer." Unlike
 * `better-auth` (which ships no files of its own and relies entirely on an
 * `better-auth+<orm>` glue fragment for both its real `auth.ts` and the
 * demo routes), Clerk ships a complete, self-contained demo — `auth.ts`,
 * `home`/`sign-in`/`dashboard`/`notes` routes, and its own `root.tsx` — in
 * one fragment, with no glue fragment ever selected alongside it: `requires`
 * is empty, so any database/ORM choice (or none at all) is valid.
 */
export const clerkProvider = defineProvider({
  layer: "auth",
  id: "clerk",
  label: "Clerk",
  requires: [],
  deps: {
    "@clerk/react-router": "^3.7.7",
    "@clerk/backend": "^3.31.3",
  },
  devDeps: {},
  env: [
    {
      name: "VITE_CLERK_PUBLISHABLE_KEY",
      description: "Clerk's publishable key (exposed to the browser)",
      whereToFind: "https://dashboard.clerk.com → your app → API Keys",
      secret: false,
    },
    {
      name: "CLERK_SECRET_KEY",
      description: "Clerk's secret key, used to verify sessions on the server",
      whereToFind: "https://dashboard.clerk.com → your app → API Keys",
      secret: true,
    },
  ],
  files: "providers/auth/clerk",
  fileManifest: [
    "app/root.tsx",
    "app/routes/home.tsx",
    "app/routes/sign-in.tsx",
    "app/routes/dashboard.tsx",
    "app/routes/notes.tsx",
    "app/server/auth.ts",
  ],
  // `app/routes.ts` itself is a structured-merge target (ticket 013's
  // `scaffolder/merge/routes.ts`), not a file this provider ships. The
  // `sign-in/*` splat matches Clerk's own documented shape for a custom
  // sign-in page — see `app/routes/sign-in.tsx`'s doc comment.
  routes: [
    { index: true, file: "routes/home.tsx" },
    { path: "sign-in/*", file: "routes/sign-in.tsx" },
    { path: "dashboard", file: "routes/dashboard.tsx" },
    { path: "notes", file: "routes/notes.tsx" },
  ],
  nextSteps: [
    "Set VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from the Clerk dashboard's API Keys page.",
  ],
});
