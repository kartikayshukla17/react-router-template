/**
 * Backs `app/server/realtime.ts`'s `subscribe`/`publish` (PRD.md §9's
 * fixed realtime interface) with a generic, channel-scoped event log —
 * Convex itself has no "channel" primitive, just reactive queries, so
 * `subscribe` is implemented as a live query over this table filtered by
 * `channel`, and `publish` is a plain insert.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { channel: v.string() },
  handler: async (ctx, { channel }) => {
    return ctx.db
      .query("events")
      .withIndex("by_channel", (q) => q.eq("channel", channel))
      .order("desc")
      .take(50);
  },
});

export const publish = mutation({
  args: { channel: v.string(), payload: v.any() },
  handler: async (ctx, { channel, payload }) => {
    await ctx.db.insert("events", { channel, payload });
  },
});
