import { defineProvider } from "../define-provider.js";

/**
 * Better Auth (https://www.better-auth.com). Ships no files of its own —
 * the real `app/server/auth.ts` implementation, the auth schema tables, and
 * the demo sign-in/dashboard/notes routes are all owned by the
 * `better-auth+drizzle` glue fragment, since Better Auth is never valid
 * without an ORM + SQL database (PRD §9) and this repo only has one ORM
 * (Drizzle) wired up yet.
 */
export const betterAuthProvider = defineProvider({
  layer: "auth",
  id: "better-auth",
  label: "Better Auth",
  requires: [
    { layer: "orm", oneOf: ["drizzle"] },
    { layer: "database", oneOf: ["postgres"] },
  ],
  deps: {
    "better-auth": "^1.7.12",
  },
  devDeps: {},
  env: [
    {
      name: "BETTER_AUTH_SECRET",
      description: "Secret used to sign Better Auth sessions and cookies",
      whereToFind: "Generate one yourself, e.g. `openssl rand -base64 32`",
      secret: true,
    },
    {
      name: "BETTER_AUTH_URL",
      description: "The base URL this app is served from",
      whereToFind: "http://localhost:3000 for local development",
      secret: false,
    },
  ],
  files: "providers/auth/better-auth",
  fileManifest: [],
  nextSteps: ["Set BETTER_AUTH_SECRET in your .env file (a random 32+ byte string)."],
});
