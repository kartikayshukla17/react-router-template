import { defineProvider } from "../define-provider.js";

/**
 * Firebase Storage (ticket 014) — the third BaaS-native storage option,
 * and the third proof (after `auth/supabase-auth`/010, `auth/firebase-
 * auth`/011) that a shared BaaS client installs once no matter how many
 * layers need it. `requires: []`: storage is independent of auth/database
 * exactly like `storage/s3-presigned`/`storage/supabase-storage` —
 * Firebase Storage works even paired with Better Auth and a Docker
 * Postgres database (ticket 014's own example).
 *
 * No `deps` of its own: `firebase-admin` is pinned on the shared
 * `firebase-client` fragment, since this provider's `app/server/
 * storage.ts` only ever calls `getStorage()` against the `adminApp` that
 * fragment's `app/server/firebase-admin.ts` exports.
 */
export const firebaseStorageProvider = defineProvider({
  layer: "storage",
  id: "firebase-storage",
  label: "Firebase Storage",
  baas: "firebase",
  requires: [],
  deps: {},
  devDeps: {},
  env: [
    {
      name: "FIREBASE_STORAGE_BUCKET",
      description: "The Firebase (Cloud Storage) bucket this app uploads to",
      whereToFind:
        "Firebase console → Storage → bucket name (e.g. your-project.firebasestorage.app)",
      secret: false,
    },
  ],
  files: "providers/storage/firebase-storage",
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
  nextSteps: ["Enable Cloud Storage for your Firebase project in the Firebase console → Storage."],
});
