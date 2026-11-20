/**
 * The `/notes` demo adapted to Convex functions (ticket 012) instead of an
 * ORM call — `app/server/db.ts` (sibling file) is the only thing that
 * calls these, over `ConvexHttpClient`, so every route keeps reaching the
 * database exactly the way every other provider's `/notes` demo does:
 * through `listNotes`/`createNote`/`deleteNote` in `app/server/db.ts`.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: { userId: v.id("users"), title: v.string(), content: v.string() },
  handler: async (ctx, { userId, title, content }) => {
    await ctx.db.insert("notes", { userId, title, content });
  },
});

export const remove = mutation({
  args: { userId: v.id("users"), id: v.id("notes") },
  handler: async (ctx, { userId, id }) => {
    const note = await ctx.db.get(id);
    if (note && note.userId === userId) {
      await ctx.db.delete(id);
    }
  },
});
