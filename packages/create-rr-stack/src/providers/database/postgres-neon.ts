import { defineProvider } from "../define-provider.js";

/**
 * Postgres hosted on Neon (https://neon.tech). Ships no files of its own —
 * only the Neon driver dependency and the `DATABASE_URL` env var — because
 * the actual connection code lives in the `drizzle+postgres-neon` glue
 * fragment's `app/server/db.ts` (`providers/glue/drizzle-postgres-neon.ts`),
 * which constructs the client against Neon's HTTP driver.
 */
export const postgresNeonProvider = defineProvider({
  layer: "database",
  id: "postgres-neon",
  label: "PostgreSQL (Neon)",
  deps: {
    "@neondatabase/serverless": "^1.2.0",
  },
  devDeps: {},
  env: [
    {
      name: "DATABASE_URL",
      description: "Postgres connection string for your Neon project",
      whereToFind: "Neon dashboard (https://console.neon.tech) → your project → Connection Details",
      secret: true,
    },
  ],
  files: "providers/database/postgres-neon",
  fileManifest: [],
  nextSteps: [
    "Create a Neon project at https://console.neon.tech if you don't have one yet.",
    "Copy the pooled connection string into DATABASE_URL in your .env file.",
  ],
});
