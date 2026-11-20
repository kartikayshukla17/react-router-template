import { defineProvider } from "../define-provider.js";

/**
 * S3/R2 presigned upload (ticket 013) — the storage layer's first
 * provider, and the first ticket to exercise `app/server/storage.ts` and
 * the `/files` demo route at all. `requires: []`: storage needs nothing
 * from any other layer, same independence as the no-ORM-required auth
 * providers (009/010/011).
 *
 * One provider covers both AWS S3 and Cloudflare R2 — same S3-compatible
 * API, differing only in `S3_ENDPOINT` (unset for AWS, the account
 * endpoint for R2) — rather than two providers that would otherwise be
 * byte-identical.
 *
 * `routes` (ticket 013's new structured merge, `scaffolder/merge/
 * routes.ts`) is what lets `/files` coexist with whatever auth fragment
 * is also selected: storage used to be impossible to combine with any
 * auth provider, every one of which already owned `app/routes.ts`
 * outright, before that merger existed.
 */
export const s3PresignedProvider = defineProvider({
  layer: "storage",
  id: "s3-presigned",
  label: "S3 / Cloudflare R2 (presigned upload)",
  requires: [],
  deps: {
    "@aws-sdk/client-s3": "^3.1173.0",
    "@aws-sdk/s3-request-presigner": "^3.1173.0",
  },
  devDeps: {
    tsx: "^4.23.15",
  },
  env: [
    {
      name: "S3_BUCKET",
      description: "The S3 (or R2) bucket this app uploads to",
      whereToFind: "AWS S3 console → your bucket's name, or the R2 dashboard → your bucket's name",
      secret: false,
    },
    {
      name: "S3_REGION",
      description: 'The bucket\'s AWS region (R2 users: leave as "auto")',
      whereToFind: "AWS S3 console → bucket → Properties → AWS Region",
      secret: false,
    },
    {
      name: "S3_ENDPOINT",
      description: "S3-compatible endpoint URL — leave unset for AWS S3; required for R2",
      whereToFind:
        "Cloudflare dashboard → R2 → your bucket → Settings → S3 API (e.g. https://<account-id>.r2.cloudflarestorage.com)",
      secret: false,
    },
    {
      name: "S3_ACCESS_KEY_ID",
      description: "Access key ID with read/write access to the bucket",
      whereToFind:
        "AWS IAM console → Access keys, or the Cloudflare dashboard → R2 → Manage R2 API Tokens",
      secret: true,
    },
    {
      name: "S3_SECRET_ACCESS_KEY",
      description: "Secret access key paired with S3_ACCESS_KEY_ID",
      whereToFind: "Shown once when the access key above is created — store it now",
      secret: true,
    },
  ],
  files: "providers/storage/s3-presigned",
  fileManifest: [
    "app/server/storage.ts",
    "app/routes/files.tsx",
    "app/routes/upload-url.tsx",
    "scripts/cleanup-orphaned-files.ts",
  ],
  // `app/routes.ts` itself is a structured-merge target (ticket 013's
  // `scaffolder/merge/routes.ts`), not a file this provider ships.
  routes: [
    { path: "files", file: "routes/files.tsx" },
    { path: "upload-url", file: "routes/upload-url.tsx" },
  ],
  scripts: {
    "storage:cleanup": "tsx scripts/cleanup-orphaned-files.ts",
  },
  nextSteps: [
    "Create an S3 bucket (or R2 bucket) and an access key with read/write access to it.",
    "Uploads are checksum-validated (SHA-256, computed in the browser) — a corrupted or tampered upload is rejected by S3/R2 itself, not just by this app.",
    "Run `npm run storage:cleanup` on a schedule (cron, a scheduled CI job) to delete abandoned uploads older than 24h.",
  ],
});
