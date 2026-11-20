import { Form } from "react-router";
import { requireUser } from "~/server/auth";
import { createNote, deleteNote, listNotes } from "~/server/db";
import type { Route } from "./+types/notes";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Notes" }];
}

/**
 * Scoped by `user.id` — Clerk's own user id, stored as plain text (per the
 * PRD's documented "no user-sync table" tradeoff for third-party auth, same
 * as every `better-auth+<orm>` glue fragment's `notes` schema). When no
 * database was selected, these calls hit the base stub's `notConfigured()`
 * at request time, not at typecheck/build time — see `app/server/db.ts`.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const notes = await listNotes(user.id);
  return { notes };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "create") {
    const title = String(formData.get("title") ?? "");
    const content = String(formData.get("content") ?? "");
    await createNote(user.id, title, content);
  } else if (intent === "delete") {
    const id = String(formData.get("id") ?? "");
    await deleteNote(user.id, id);
  }

  return null;
}

export default function Notes({ loaderData }: Route.ComponentProps) {
  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Notes</h1>
      <Form method="post" className="space-y-2">
        <input type="hidden" name="intent" value="create" />
        <input name="title" placeholder="Title" required className="w-full rounded border p-2" />
        <textarea name="content" placeholder="Content" className="w-full rounded border p-2" />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Add note
        </button>
      </Form>
      <ul className="space-y-2">
        {loaderData.notes.map((note) => (
          <li key={note.id} className="flex items-start justify-between gap-4 rounded border p-3">
            <div>
              <p className="font-medium">{note.title}</p>
              <p className="text-sm text-gray-600">{note.content}</p>
            </div>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={note.id} />
              <button type="submit" className="text-sm text-red-600 underline">
                Delete
              </button>
            </Form>
          </li>
        ))}
      </ul>
    </main>
  );
}
