import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
