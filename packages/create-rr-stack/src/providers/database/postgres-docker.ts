import { defineProvider } from "../define-provider.js";

/**
 * Postgres run locally via Docker Compose — the self-hosted alternative to
 * `postgres-neon` for people without a Neon/Supabase account. Ships a real
 * `docker-compose.yml` (postgres image, named volume, exposed port, fixed
 * local-dev credentials) under
 * `templates/providers/database/postgres-docker/`.
 *
 * Ships no ORM wiring of its own, same as `postgres-neon` — the real
 * `app/server/db.ts` connection code comes from `drizzle+postgres-docker`
 * (`providers/glue/drizzle-postgres-docker.ts`), the glue fragment that
 * knows this host needs a plain TCP driver (`postgres`/postgres.js) rather
 * than Neon's HTTP driver.
 *
 * No account-signup next step, unlike Neon: the credentials are fixed and
 * already match `docker-compose.yml`, so the only setup step is starting
 * the container.
 */
export const postgresDockerProvider = defineProvider({
  layer: "database",
  id: "postgres-docker",
  label: "PostgreSQL (Docker)",
  deps: {},
  devDeps: {},
  env: [
    {
      name: "DATABASE_URL",
      description: "Postgres connection string for the local Docker container",
      whereToFind:
        "docker-compose.yml — matches its fixed credentials: postgres://app:app@localhost:5432/app",
      secret: false,
    },
  ],
  files: "providers/database/postgres-docker",
  fileManifest: ["docker-compose.yml"],
  nextSteps: ["Run `docker compose up -d` to start Postgres (no account signup needed)."],
});
