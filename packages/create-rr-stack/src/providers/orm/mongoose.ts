import { defineProvider } from "../define-provider.js";

/**
 * Mongoose, the one non-SQL ORM in v1 (aside from Convex, ticket 012, which
 * is its own bundle rather than an ORM choice). Host-independent, same
 * reasoning as `orm/drizzle`'s Postgres hosts: `mongodb-docker` and
 * `mongodb-hosted` differ only in connection-string provenance, not in
 * driver, so there's exactly one `mongoose+mongodb` glue fragment
 * (`providers/glue/mongoose-mongodb.ts`) regardless of which host was
 * picked — selected whenever `selections.database === "mongodb"`, the same
 * way `drizzle+sqlite` is selected unconditionally once `database ===
 * "sqlite"`.
 *
 * `requires: database in [mongodb]` is the only constraint this provider
 * needs: unlike Drizzle (whose Postgres-host availability is further
 * narrowed in `resolver/rules.ts` because each host needs its own driver
 * fragment), Mongoose has no host-driver variation to gate on, so the
 * generic `provider-requires-and-conflicts` rule is sufficient — no entry
 * in `providerAvailabilityChecks` is needed for Mongoose itself (only for
 * *hiding Drizzle/Prisma* when Mongo is picked — see
 * `resolver/rules.ts`'s `providerAvailabilityChecks.drizzle`).
 *
 * Ships no files of its own, same as `orm/drizzle`: the real
 * `app/server/db.ts` (connection + `Note` model usage) and `app/db/
 * schema.ts` (the `Note` model itself) come from the `mongoose+mongodb`
 * glue fragment.
 */
export const mongooseProvider = defineProvider({
  layer: "orm",
  id: "mongoose",
  label: "Mongoose",
  requires: [{ layer: "database", oneOf: ["mongodb"] }],
  deps: {
    mongoose: "^9.12.3",
  },
  devDeps: {},
  env: [],
  files: "providers/orm/mongoose",
  fileManifest: [],
  nextSteps: [],
});
