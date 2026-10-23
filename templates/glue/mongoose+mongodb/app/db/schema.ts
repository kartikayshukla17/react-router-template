/**
 * Starter Mongoose model for the demo `/notes` route — the MongoDB flavor
 * of `orm/drizzle`'s SQL table schemas (`app/db/schema.ts`). Shipped by the
 * `mongoose+mongodb` glue fragment rather than by `orm/mongoose` itself,
 * since the model needs to exist before `app/server/db.ts` (same fragment)
 * can query it.
 *
 * `userId` stores the auth provider's user id as a plain string, not a
 * Mongo `ObjectId` reference — per PRD.md §9's documented tradeoff, there's
 * no user-sync collection for third-party auth in v1, so this model stays
 * correct even if a non-Mongoose-backed auth provider were ever swapped in.
 */
import mongoose from "mongoose";

export interface NoteDocument {
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

const noteSchema = new mongoose.Schema<NoteDocument>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true, default: "" },
  createdAt: { type: Date, required: true, default: () => new Date() },
});

/**
 * Guards against Mongoose's "Cannot overwrite model once compiled" error
 * under dev-server module re-evaluation (e.g. Vite HMR) by reusing an
 * already-registered model instead of redefining it.
 */
export const NoteModel =
  (mongoose.models.Note as mongoose.Model<NoteDocument> | undefined) ??
  mongoose.model<NoteDocument>("Note", noteSchema);
