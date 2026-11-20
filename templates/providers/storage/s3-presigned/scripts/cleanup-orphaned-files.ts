/**
 * Orphaned-upload cleanup — a simple cron-style script, not a background
 * worker: run it on a schedule (cron, a scheduled CI job, whatever this
 * deployment already has) via `npm run storage:cleanup`. See `app/server/
 * storage.ts`'s doc comment for why `pending/` objects can be orphaned at
 * all (a presigned upload the browser started but never confirmed) and
 * why deleting them is safe once they're older than `MIN_AGE_MS`.
 */
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET ?? "";
const PENDING_PREFIX = "pending/";

/** 24 hours — long enough that a slow-but-legitimate upload never races this. */
const MIN_AGE_MS = 1000 * 60 * 60 * 24;

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

async function main(): Promise<void> {
  const cutoff = Date.now() - MIN_AGE_MS;
  let continuationToken: string | undefined;
  let deleted = 0;

  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: PENDING_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of page.Contents ?? []) {
      if (!object.Key || !object.LastModified) {
        continue;
      }
      if (object.LastModified.getTime() < cutoff) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: object.Key }));
        deleted += 1;
        console.log(`Deleted orphaned upload: ${object.Key}`);
      }
    }

    continuationToken = page.NextContinuationToken;
  } while (continuationToken);

  console.log(`Done. Deleted ${deleted} orphaned upload(s) older than 24h.`);
}

await main();
