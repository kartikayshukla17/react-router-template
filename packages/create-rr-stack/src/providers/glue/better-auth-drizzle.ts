import path from "node:path";
import type { Glue } from "../../resolver/types.js";
import { templatesRoot } from "../templates-root.js";

/**
 * Wires Better Auth's Drizzle adapter into the real `app/server/auth.ts`
 * (replacing the throwing base stub) and adds the auth tables Better Auth
 * needs (`app/db/auth-schema.ts` — user/session/account/verification),
 * kept in a file separate from `orm/drizzle`'s own `app/db/schema.ts` so the
 * two fragments never claim the same output path.
 *
 * Also ships the demo routes (landing, sign-in, protected dashboard, notes
 * CRUD) — the demo only makes sense once both an ORM and an auth provider
 * are present, so it travels with this glue fragment rather than with either
 * provider alone or a separate "extras" mechanism.
 */
export const betterAuthDrizzleGlue: Glue = {
  between: ["drizzle", "better-auth"],
  files: path.join(templatesRoot, "glue/better-auth+drizzle"),
  fileManifest: [
    "app/server/auth.ts",
    "app/db/auth-schema.ts",
    "app/routes.ts",
    "app/routes/home.tsx",
    "app/routes/sign-in.tsx",
    "app/routes/dashboard.tsx",
    "app/routes/notes.tsx",
  ],
};
