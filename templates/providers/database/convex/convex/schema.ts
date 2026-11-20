/**
 * Convex's own fixed project layout puts this at the project root
 * (`convex/`), a sibling of `app/`, not nested under it — unlike every
 * other database provider, whose schema lives under `app/db/`.
 *
 * `users`/`sessions` back `auth/convex-auth`'s hand-rolled password auth
 * (see that provider's `convex/auth.ts` and `app/server/auth.ts` for why
 * this project implements sign-in itself as Convex functions rather than
 * depending on the `@convex-dev/auth` package, which had a breaking
 * rewrite — `0.0.x` to `2.x` — underway as of this ticket). `notes.userId`
 * is a real `v.id("users")` reference, unlike every third-party-auth
 * provider's plain-text `userId` column: Convex's own `auth/convex-auth`
 * owns the `users` table in this same database, so there's no "no
 * user-sync table" tradeoff to make here.
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
  }).index("by_user", ["userId"]),

  events: defineTable({
    channel: v.string(),
    payload: v.any(),
  }).index("by_channel", ["channel"]),
});
