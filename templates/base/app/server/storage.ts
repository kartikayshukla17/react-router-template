/**
 * Storage server interface — fixed shape across every storage provider fragment.
 *
 * No storage provider is selected in the base template, so every export below
 * throws at call time. A provider fragment (e.g. `providers/storage/s3-r2`)
 * replaces this file wholesale with a real implementation of the same shape.
 */

export interface UploadUrl {
  url: string;
  headers: Record<string, string>;
}

function notConfigured(): never {
  throw new Error(
    "No storage provider configured. Select a storage provider when scaffolding " +
      "this app to replace app/server/storage.ts with a working implementation.",
  );
}

export function getUploadUrl(_key: string, _contentType: string): Promise<UploadUrl> {
  return notConfigured();
}

export function getDownloadUrl(_key: string): Promise<string> {
  return notConfigured();
}

export function remove(_key: string): Promise<void> {
  return notConfigured();
}
