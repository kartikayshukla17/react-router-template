import path from "node:path";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/*.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(process.cwd(), "sqlite.db"),
  },
});
