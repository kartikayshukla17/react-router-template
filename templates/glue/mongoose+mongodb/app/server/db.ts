/**
 * Database server interface — real implementation for Mongoose + MongoDB.
 *
 * Replaces the base template's throwing stub. The only provider SDK imports
 * in the whole generated app live here (and in `app/server/auth.ts`, for
 * the auth provider) — every route reaches the database only through the
 * helpers exported below, never by importing `mongoose` directly.
 *
 * `await mongoose.connect(...)` runs at module load, against `MONGODB_URI`
 * — set by whichever MongoDB host was selected (a local Docker Compose
 * container or a hosted cluster such as MongoDB Atlas; the connection code
 * itself is identical either way, since both are just a standard MongoDB
 * connection string, unlike Postgres's per-host driver split). The
 * top-level `await` (valid ESM, and this template targets Node >=22)
 * guarantees the connection is established — and `mongooseConnection.db` is
 * defined — before any other module that imports from here finishes
 * loading, which `app/server/auth.ts` (shipped by the `better-auth+
 * mongoose` glue fragment) depends on; see that file's doc comment for why.
 */
import mongoose from "mongoose";
import { NoteModel } from "../db/schema.js";

await mongoose.connect(process.env.MONGODB_URI ?? "");

export const mongooseConnection = mongoose.connection;

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export async function listNotes(userId: string): Promise<Note[]> {
  const docs = await NoteModel.find({ userId }).sort({ createdAt: -1 });
  return docs.map((doc) => ({
    id: doc._id.toString(),
    userId: doc.userId,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
  }));
}

export async function createNote(userId: string, title: string, content: string): Promise<void> {
  await NoteModel.create({ userId, title, content });
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await NoteModel.deleteOne({ _id: id, userId });
}
