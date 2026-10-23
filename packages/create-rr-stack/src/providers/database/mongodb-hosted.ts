import { defineProvider } from "../define-provider.js";

/**
 * Hosted MongoDB, used over a plain connection string. Ships no files of its
 * own, same as `postgres-neon`/`postgres-supabase`: there's no driver-level
 * wiring that differs by host, so the connection code lives entirely in the
 * host-independent `mongoose+mongodb` glue fragment
 * (`providers/glue/mongoose-mongodb.ts`).
 *
 * Deliberately named `"hosted"`, not `"atlas"`: the CLI never creates an
 * Atlas (or any other) account or cluster — it only ever asks for a
 * `MONGODB_URI` value and tells the user where a typical hosted provider
 * (MongoDB Atlas, the one MongoDB Inc. itself runs, named here only as the
 * default pointer — any standard `mongodb+srv://` connection string works)
 * puts it. Picking Atlas as the one named example mirrors `postgres-neon`
 * picking Neon: one concrete, zero-cost-tier pointer rather than a vague
 * "any hosted Mongo" non-answer, without the CLI being coupled to it in any
 * other way.
 */
export const mongodbHostedProvider = defineProvider({
  layer: "database",
  id: "mongodb-hosted",
  label: "MongoDB (hosted)",
  deps: {},
  devDeps: {},
  env: [
    {
      name: "MONGODB_URI",
      description: "MongoDB connection string for your hosted cluster",
      whereToFind:
        "MongoDB Atlas dashboard (https://cloud.mongodb.com) → your cluster → Connect → Drivers → copy the connection string (or any other hosted MongoDB's connection string)",
      secret: true,
    },
  ],
  files: "providers/database/mongodb-hosted",
  fileManifest: [],
  nextSteps: [
    "Create a free MongoDB Atlas cluster at https://cloud.mongodb.com if you don't have a hosted MongoDB yet (the CLI never creates one for you).",
    "Copy its connection string into MONGODB_URI in your .env file.",
  ],
});
