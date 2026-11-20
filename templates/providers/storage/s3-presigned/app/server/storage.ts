/**
 * Storage server interface — real implementation over the AWS SDK v3 S3
 * client. Works unmodified for Cloudflare R2 too: R2 speaks the same
 * S3-compatible API, differing only in which endpoint it's reached at —
 * `S3_ENDPOINT` is unset for AWS S3 (the SDK's own default endpoint
 * resolution applies) and set to the account's R2 endpoint otherwise. The
 * only AWS/R2 SDK imports in the whole generated app live here; every
 * route reaches storage only through the helpers exported below.
 *
 * Presigned-upload checksum validation needs the digest's actual value
 * before signing — the PRD's literal `getUploadUrl(key, contentType)`
 * can't carry that, so this is a documented deviation: an optional third
 * parameter, `sha256Base64`. When the caller (`app/routes/files.tsx`)
 * supplies it, it's set as `ChecksumSHA256` directly on the
 * `PutObjectCommand` *before* signing — baked into the signed request
 * itself, not a header added after the fact — so S3 rejects an upload
 * whose bytes don't hash to that exact value.
 *
 * Orphan handling: an upload is presigned against a temporary
 * `pending/<key>` object. Only once the browser's PUT actually succeeds
 * does `confirmUpload` (called from `files.tsx`'s own action, not part of
 * the fixed interface) server-side-copy it to `uploads/<key>` and delete
 * the pending original — so a key only ever shows up in `listFiles()` once
 * the upload is known-complete. A client that never confirms (crashed,
 * closed the tab, abandoned the upload) leaves a `pending/<key>` object
 * nothing ever references again; `scripts/cleanup-orphaned-files.ts`
 * (sibling file, run on a schedule, not a background worker) deletes
 * whatever's left under `pending/` past an age threshold.
 */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.S3_BUCKET ?? "";

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

const PRESIGNED_URL_TTL_SECONDS = 60 * 5;
const PENDING_PREFIX = "pending/";
const UPLOADS_PREFIX = "uploads/";

export interface UploadUrl {
  url: string;
  headers: Record<string, string>;
}

export async function getUploadUrl(
  key: string,
  contentType: string,
  sha256Base64?: string,
): Promise<UploadUrl> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: `${PENDING_PREFIX}${key}`,
    ContentType: contentType,
    ChecksumSHA256: sha256Base64,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (sha256Base64) {
    headers["x-amz-checksum-sha256"] = sha256Base64;
  }
  return { url, headers };
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: `${UPLOADS_PREFIX}${key}` });
  return getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
}

export async function remove(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: `${UPLOADS_PREFIX}${key}` }));
}

/** Used by the `/files` demo route's action, once the browser's PUT succeeds. */
export async function confirmUpload(key: string): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: `${UPLOADS_PREFIX}${key}`,
      CopySource: `${bucket}/${PENDING_PREFIX}${key}`,
    }),
  );
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: `${PENDING_PREFIX}${key}` }));
}

export interface StoredFile {
  key: string;
  size: number;
  lastModified: Date;
}

/** Used by the `/files` demo route's loader — lists confirmed uploads only. */
export async function listFiles(): Promise<StoredFile[]> {
  const result = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: UPLOADS_PREFIX }),
  );
  return (result.Contents ?? []).map((object) => ({
    key: (object.Key ?? "").slice(UPLOADS_PREFIX.length),
    size: object.Size ?? 0,
    lastModified: object.LastModified ?? new Date(0),
  }));
}
