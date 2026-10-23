/**
 * Prisma CLI config — same as `prisma+postgres-docker`'s; see that
 * fragment's copy of this file for the full explanation of why
 * `dotenv/config` is imported and why `schema` points at a folder.
 */
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema"),
});
