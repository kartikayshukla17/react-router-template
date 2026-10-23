import { defineProvider } from "../define-provider.js";

/**
 * MongoDB run locally via Docker Compose — the self-hosted alternative to
 * `mongodb-hosted` for people without an Atlas (or other hosted Mongo)
 * account. Ships a real `docker-compose.yml` (official `mongo` image, named
 * volume, exposed port) under
 * `templates/providers/database/mongodb-docker/`.
 *
 * No auth configured on the container — a throwaway local dev database,
 * same spirit as `postgres-docker`'s fixed `app/app/app` credentials, just
 * with no credentials at all (Mongo's Docker image runs without auth by
 * default unless `MONGO_INITDB_ROOT_USERNAME`/`PASSWORD` are set).
 *
 * Ships no ORM wiring of its own, same as every other `database/*`
 * provider: the real `app/server/db.ts` connection code (`mongoose.connect`)
 * comes from the `mongoose+mongodb` glue fragment
 * (`providers/glue/mongoose-mongodb.ts`), which is identical regardless of
 * host — Mongo, unlike Postgres, doesn't need a different driver per host,
 * only a different connection string, which is why this provider (and its
 * `mongodb-hosted` sibling) carries nothing but the env var and, for Docker,
 * the compose file.
 */
export const mongodbDockerProvider = defineProvider({
  layer: "database",
  id: "mongodb-docker",
  label: "MongoDB (Docker)",
  deps: {},
  devDeps: {},
  env: [
    {
      name: "MONGODB_URI",
      description: "MongoDB connection string for the local Docker container",
      whereToFind: "docker-compose.yml — matches its exposed port: mongodb://localhost:27017/app",
      secret: false,
    },
  ],
  files: "providers/database/mongodb-docker",
  fileManifest: ["docker-compose.yml"],
  nextSteps: ["Run `docker compose up -d` to start MongoDB (no account signup needed)."],
});
