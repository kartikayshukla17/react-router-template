/**
 * Database server interface — real implementation over Convex's own
 * client/functions (`convex/notes.ts`, sibling of `app/`). Deliberately
 * kept to the exact same `listNotes`/`createNote`/`deleteNote(userId,
 * ...)` shape every other provider's `/notes` demo uses, so `app/routes/
 * notes.tsx` can be (and is) identical to the SQL/Mongo providers' —
 * Convex's `userId` is a real `Id<"users">` reference (see
 * `convex/schema.ts`'s doc comment for why that's fine here, unlike the
 * plain-text column every third-party-auth provider uses), cast from the
 * plain string `app/server/auth.ts` hands back from `requireUser`.
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const convexUrl = process.env.VITE_CONVEX_URL ?? "";

function client(): ConvexHttpClient {
  return new ConvexHttpClient(convexUrl);
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export async function listNotes(userId: string): Promise<Note[]> {
  const docs = await client().query(api.notes.list, { userId: userId as Id<"users"> });
  return docs.map((doc) => ({
    id: doc._id,
    userId: doc.userId,
    title: doc.title,
    content: doc.content,
    createdAt: new Date(doc._creationTime),
  }));
}

export async function createNote(userId: string, title: string, content: string): Promise<void> {
  await client().mutation(api.notes.create, { userId: userId as Id<"users">, title, content });
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await client().mutation(api.notes.remove, {
    userId: userId as Id<"users">,
    id: id as Id<"notes">,
  });
}
