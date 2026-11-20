/**
 * Database server interface — fixed seam across every database/ORM provider
 * fragment. The real shape of `db` (Drizzle client, Prisma client, Mongoose
 * models, Convex client, ...) is provider-specific and decided later; this
 * stub only guarantees the seam exists at `app/server/db.ts`.
 *
 * No database provider is selected in the base template, so touching any
 * property on `db` throws at call time. A provider fragment (e.g.
 * `providers/database/postgres-docker` + an ORM fragment) replaces this file
 * wholesale with a real client of the same name.
 */

function notConfigured(): never {
  throw new Error(
    "No database provider configured. Select a database provider when scaffolding " +
      "this app to replace app/server/db.ts with a working client.",
  );
}

export type DbClient = Record<string, never>;

export const db: DbClient = new Proxy({} as DbClient, {
  get() {
    return notConfigured();
  },
  apply() {
    return notConfigured();
  },
});

/**
 * `/notes` demo seam (PRD.md §51/122), stubbed the same way as `db` above.
 * Every database+ORM glue fragment (`drizzle+*`, `prisma+*`, `mongoose+
 * mongodb`) implements this with the identical signature regardless of
 * dialect — needed here too because an auth provider with no database
 * requirement (`auth/clerk`, ticket 009) ships its own `/notes` route
 * unconditionally, the same way `better-auth+<orm>`'s demo routes do, and
 * that route must still typecheck when no database was selected.
 */
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export async function listNotes(_userId: string): Promise<Note[]> {
  return notConfigured();
}

export async function createNote(_userId: string, _title: string, _content: string): Promise<void> {
  return notConfigured();
}

export async function deleteNote(_userId: string, _id: string): Promise<void> {
  return notConfigured();
}
