/**
 * A resource route — no default export, so React Router never renders it
 * as a page; it exists to be `fetch()`-ed directly. `app/routes/files.tsx`
 * can't ask for a signed upload URL through its own `action`: a plain
 * `fetch()` to an ordinary route (one with a component) gets the full
 * rendered document back, not the action's raw return value — only a
 * resource route's response is exactly what its action/loader returns.
 */
import { getUploadUrl } from "~/server/storage";
import type { Route } from "./+types/upload-url";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const key = String(formData.get("key") ?? "");
  const contentType = String(formData.get("contentType") ?? "application/octet-stream");

  const uploadUrl = await getUploadUrl(key, contentType);
  return Response.json({ uploadUrl });
}
