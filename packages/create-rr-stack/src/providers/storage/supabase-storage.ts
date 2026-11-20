import { defineProvider } from "../define-provider.js";

/**
 * Supabase Storage (ticket 014) — the second BaaS-native storage option,
 * and the second proof (after `auth/supabase-auth`, ticket 010) that the
 * shared `supabase-client` fragment installs once no matter how many
 * layers need it. `requires: []`: storage is independent of auth/database
 * exactly like `storage/s3-presigned` — Supabase Storage works even
 * paired with Clerk auth and a Neon database (ticket 014's own example).
 *
 * No `deps` of its own: `@supabase/supabase-js` is pinned on the shared
 * `supabase-client` fragment, since this provider's `app/server/
 * storage.ts` only ever calls `supabase.storage` on the client that
 * fragment exports.
 */
export const supabaseStorageProvider = defineProvider({
  layer: "storage",
  id: "supabase-storage",
  label: "Supabase Storage",
  baas: "supabase",
  requires: [],
  deps: {},
  devDeps: {},
  env: [
    {
      name: "SUPABASE_STORAGE_BUCKET",
      description: "The Supabase Storage bucket this app uploads to",
      whereToFind: "Supabase dashboard → your project → Storage → bucket name",
      secret: false,
    },
  ],
  files: "providers/storage/supabase-storage",
  fileManifest: ["app/server/storage.ts"],
  // `app/routes.ts` itself is a structured-merge target (ticket 013's
  // `scaffolder/merge/routes.ts`), not a file this provider ships.
  // Demo routes (ticket 016's `--no-example`) are split out below: core
  // storage wiring ships either way, the /files demo UI only when included.
  demoFileManifest: ["app/routes/files.tsx", "app/routes/upload-url.tsx"],
  demoRoutes: [
    { path: "files", file: "routes/files.tsx" },
    { path: "upload-url", file: "routes/upload-url.tsx" },
  ],
  nextSteps: [
    "Create a Storage bucket in the Supabase dashboard and set an access policy permitting uploads/reads for the role this app authenticates as (anon, or authenticated if paired with Supabase Auth).",
  ],
});
