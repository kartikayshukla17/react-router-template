/**
 * Realtime server interface — real implementation over Convex's live
 * query client (`convex/browser`'s `ConvexClient`, the WebSocket-based
 * "vanilla JS" client, not the React-hooks one `useQuery` wraps — this
 * module has no React dependency, usable from anywhere). Backed by
 * `convex/events.ts` (sibling file, project root): `subscribe` opens a
 * live query over that channel's events and calls `handler` with each
 * batch; `publish` just inserts one.
 *
 * `fixed interface (PRD.md §9)`: `subscribe(channel, handler) →
 * unsubscribe`, `publish(channel, payload) → void`.
 */
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convexUrl = process.env.VITE_CONVEX_URL ?? "";

export function subscribe(channel: string, handler: (payload: unknown) => void): () => void {
  const client = new ConvexClient(convexUrl);
  const unwatch = client.onUpdate(api.events.list, { channel }, (events) => {
    for (const event of events) {
      handler(event.payload);
    }
  });
  return () => {
    unwatch();
    void client.close();
  };
}

export async function publish(channel: string, payload: unknown): Promise<void> {
  const client = new ConvexClient(convexUrl);
  try {
    await client.mutation(api.events.publish, { channel, payload });
  } finally {
    await client.close();
  }
}
