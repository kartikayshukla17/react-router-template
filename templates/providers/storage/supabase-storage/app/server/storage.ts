/**
 * Storage server interface — real implementation over the shared Supabase
 * client's storage API (`~/server/supabase-client`, the same anon client
 * `auth/supabase-auth` and `database/postgres-supabase` share — ticket
 * 014's second proof that a shared BaaS client installs once regardless
 * of how many layers use it). The anon client runs under RLS as the
 * `anon` role (see that file's doc comment), so the target bucket needs a
 * storage policy permitting anon uploads/reads, or this app's own auth
 * layer needs to be Supabase Auth with a bucket policy scoped to
 * `authenticated` instead — a dashboard-side configuration step, not
 * something this file can do for you.
 */
import { supabase } from "~/server/supabase-client";

const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "";

/** 5 minutes, in seconds — `createSignedUrl`'s `expiresIn` unit. */
const SIGNED_URL_TTL_SECONDS = 60 * 5;

export interface UploadUrl {
  url: string;
  headers: Record<string, string>;
}

export async function getUploadUrl(key: string, contentType: string): Promise<UploadUrl> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key);
  if (error || !data) {
    throw new Error(`Could not create a signed upload URL: ${error?.message ?? "unknown error"}`);
  }
  return { url: data.signedUrl, headers: { "Content-Type": contentType } };
}

export async function getDownloadUrl(key: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    throw new Error(`Could not create a signed download URL: ${error?.message ?? "unknown error"}`);
  }
  return data.signedUrl;
}

export async function remove(key: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([key]);
  if (error) {
    throw new Error(`Could not remove the object: ${error.message}`);
  }
}

export interface StoredFile {
  key: string;
  size: number;
  lastModified: Date;
}

/** Used by the `/files` demo route's loader. */
export async function listFiles(): Promise<StoredFile[]> {
  const { data, error } = await supabase.storage.from(bucket).list();
  if (error || !data) {
    throw new Error(`Could not list the bucket: ${error?.message ?? "unknown error"}`);
  }
  return data.map((object) => ({
    key: object.name,
    size: object.metadata?.size ?? 0,
    lastModified: new Date(object.updated_at ?? object.created_at ?? 0),
  }));
}
