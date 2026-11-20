/**
 * Hand-rolled password auth as plain Convex functions — ticket 012
 * deliberately doesn't depend on `@convex-dev/auth`: that package had a
 * breaking rewrite (`0.0.x` → `2.x`, a from-scratch "components"
 * architecture) underway as of this ticket, with no documented way to
 * drive its sign-in from a plain server action rather than its React
 * hooks. These functions do no password hashing themselves — `app/server/
 * auth.ts` (sibling concern, lives under `app/`) hashes with Node's
 * `node:crypto` before ever calling `createUser`, and verifies a fetched
 * hash before calling `createSession` — so nothing here needs Node's
 * crypto module, which Convex's default function runtime (a restricted,
 * Workers-like V8 isolate, not full Node) doesn't provide anyway.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** 14 days, in milliseconds. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

export const createUser = mutation({
  args: { email: v.string(), passwordHash: v.string() },
  handler: async (ctx, { email, passwordHash }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      throw new Error("An account with that email already exists.");
    }
    return ctx.db.insert("users", { email, passwordHash });
  },
});

export const createSession = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", { userId, token, expiresAt: Date.now() + SESSION_TTL_MS });
    return token;
  },
});

export const getSessionUser = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    const user = await ctx.db.get(session.userId);
    return user ? { id: user._id, email: user.email } : null;
  },
});

export const deleteSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
