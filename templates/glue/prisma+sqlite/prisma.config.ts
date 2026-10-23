/**
 * Prisma CLI config — same as `prisma+postgres-docker`'s; see that
 * fragment's copy of this file for the full explanation of why
 * `dotenv/config` is imported and why `schema` points at a folder. SQLite
 * doesn't need `DATABASE_URL` (the file path is a fixed local default
 * baked into `prisma/schema/schema.prisma`'s `datasource` block), but the
 * `dotenv/config` import is harmless either way and keeps this file
 * identical across all four `prisma+<host>` fragments.
 */
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema"),
});
