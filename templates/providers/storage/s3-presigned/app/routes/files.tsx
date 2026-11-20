/**
 * The upload itself can't be a plain `<Form>` POST: the browser has to PUT
 * the file bytes directly to S3/R2 (the whole point of presigned uploads
 * is the app server never sees them), and it has to compute the SHA-256
 * checksum from the actual `File` object before asking the server for a
 * presigned URL — the server doesn't have the bytes to hash. So this is a
 * three-step client-driven flow: ask the `/upload-url` resource route
 * (sibling file) for a presigned URL, PUT directly to S3/R2 with
 * `fetch()`, then tell this route's own `action` the upload succeeded
 * (`intent: "confirm"`) so `app/server/storage.ts` can move it out of
 * `pending/`.
 */
import { useState } from "react";
import { useFetcher } from "react-router";
import { confirmUpload, getDownloadUrl, listFiles, remove } from "~/server/storage";
import type { Route } from "./+types/files";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Files" }];
}

export async function loader() {
  const files = await listFiles();
  const withUrls = await Promise.all(
    files.map(async (file) => ({ ...file, url: await getDownloadUrl(file.key) })),
  );
  return { files: withUrls };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "confirm") {
    const key = String(formData.get("key") ?? "");
    await confirmUpload(key);
    return { confirmed: true };
  }

  if (intent === "delete") {
    const key = String(formData.get("key") ?? "");
    await remove(key);
    return { deleted: true };
  }

  return null;
}

async function sha256Base64(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

export default function Files({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const [status, setStatus] = useState<string | null>(null);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("file");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file) {
      return;
    }

    setStatus("Preparing upload...");
    const key = `${Date.now()}-${file.name}`;
    const checksum = await sha256Base64(file);

    const prepareResponse = await fetch("/upload-url", {
      method: "POST",
      body: new URLSearchParams({
        key,
        contentType: file.type || "application/octet-stream",
        sha256: checksum,
      }),
    });
    const { uploadUrl } = (await prepareResponse.json()) as {
      uploadUrl: { url: string; headers: Record<string, string> };
    };

    setStatus("Uploading...");
    const putResponse = await fetch(uploadUrl.url, {
      method: "PUT",
      headers: uploadUrl.headers,
      body: file,
    });
    if (!putResponse.ok) {
      setStatus(`Upload failed: ${putResponse.status}`);
      return;
    }

    setStatus("Confirming...");
    fetcher.submit({ intent: "confirm", key }, { method: "post" });
    setStatus(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Files</h1>
      <form
        onSubmit={(event) => {
          void handleUpload(event);
        }}
        className="space-y-2"
      >
        <input name="file" type="file" required className="w-full rounded border p-2" />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Upload
        </button>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </form>
      <ul className="space-y-2">
        {loaderData.files.map((file) => (
          <li
            key={file.key}
            className="flex items-center justify-between gap-4 rounded border p-3"
          >
            <a href={file.url} className="text-blue-600 underline">
              {file.key}
            </a>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="key" value={file.key} />
              <button type="submit" className="text-sm text-red-600 underline">
                Delete
              </button>
            </fetcher.Form>
          </li>
        ))}
      </ul>
    </main>
  );
}
