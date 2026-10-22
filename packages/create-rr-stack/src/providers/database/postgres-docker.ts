import { defineProvider } from "../define-provider.js";

/**
 * The one real provider this ticket proves the engine against: Postgres run
 * via Docker Compose, no ORM, no auth. Its file contents are intentionally
 * minimal — the base app template (ticket 002) doesn't exist yet, so there's
 * nothing real to wire this fragment into. It still ships an actual
 * `docker-compose.yml` under templates/providers/database/postgres-docker/
 * for later tickets to build on.
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
      whereToFind: "docker-compose.yml (service credentials)",
      secret: true,
    },
  ],
  files: "providers/database/postgres-docker",
  fileManifest: ["docker-compose.yml"],
  nextSteps: ["Run `docker compose up -d` to start Postgres."],
});
