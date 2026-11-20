/**
 * Storage server interface — real implementation over the shared Firebase
 * Admin SDK instance (`~/server/firebase-admin`'s exported `adminApp` —
 * ticket 014's third proof that a shared BaaS client installs once no
 * matter how many layers need it; `auth/firebase-auth`, ticket 011, is
 * the first consumer). Firebase Storage is Google Cloud Storage
 * underneath, so these are GCS V4 signed URLs, not a Firebase-specific
 * mechanism.
 */
import { getStorage } from "firebase-admin/storage";
import { adminApp } from "~/server/firebase-admin";

const bucket = getStorage(adminApp).bucket(process.env.FIREBASE_STORAGE_BUCKET ?? "");

/** 5 minutes, in milliseconds — `getSignedUrl`'s `expires` wants a Date or epoch ms. */
const SIGNED_URL_TTL_MS = 1000 * 60 * 5;

export interface UploadUrl {
  url: string;
  headers: Record<string, string>;
}

export async function getUploadUrl(key: string, contentType: string): Promise<UploadUrl> {
  const [url] = await bucket.file(key).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + SIGNED_URL_TTL_MS,
    contentType,
  });
  return { url, headers: { "Content-Type": contentType } };
}

export async function getDownloadUrl(key: string): Promise<string> {
  const [url] = await bucket.file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + SIGNED_URL_TTL_MS,
  });
  return url;
}

export async function remove(key: string): Promise<void> {
  await bucket.file(key).delete();
}

export interface StoredFile {
  key: string;
  size: number;
  lastModified: Date;
}

/** Used by the `/files` demo route's loader. */
export async function listFiles(): Promise<StoredFile[]> {
  const [objects] = await bucket.getFiles();
  return objects.map((object) => ({
    key: object.name,
    size: Number(object.metadata.size ?? 0),
    lastModified: new Date(object.metadata.updated ?? 0),
  }));
}
