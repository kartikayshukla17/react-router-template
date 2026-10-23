import { defineProvider } from "../define-provider.js";

/**
 * Better Auth (https://www.better-auth.com). Ships no files of its own —
 * the real `app/server/auth.ts` implementation and the demo sign-in/
 * dashboard/notes routes are owned by whichever `better-auth+<orm>` glue
 * fragment matches the selected ORM (`better-auth+drizzle` for SQL,
 * `better-auth+mongoose` for Mongo, ticket 007), since Better Auth is never
 * valid without an ORM (PRD §9).
 *
 * `orm`/`database` `oneOf` lists grow together, one pair per ORM: Drizzle
 * only ever pairs with `postgres`/`sqlite` (enforced independently by
 * `drizzle`'s own `requires`), Mongoose only ever pairs with `mongodb` — so
 * listing all four here doesn't let Drizzle+Mongo or Mongoose+Postgres
 * through; those combinations are already rejected by the ORM's own
 * `requires` constraint before this one is even relevant.
 */
export const betterAuthProvider = defineProvider({
  layer: "auth",
  id: "better-auth",
  label: "Better Auth",
  requires: [
    { layer: "orm", oneOf: ["drizzle", "mongoose"] },
    { layer: "database", oneOf: ["postgres", "sqlite", "mongodb"] },
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
