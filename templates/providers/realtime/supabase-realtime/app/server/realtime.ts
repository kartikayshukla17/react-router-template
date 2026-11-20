/**
 * Realtime server interface — real implementation over the shared
 * Supabase client's Realtime Broadcast channels (`~/server/supabase-
 * client`, the same anon client `auth/supabase-auth`/`storage/supabase-
 * storage` share). Broadcast, not Postgres Changes: Broadcast is a
 * generic named-channel pub/sub with no database tie-in at all, which is
 * exactly why Supabase Realtime can pair with *any* database choice (or
 * none), not just a Supabase-hosted one — Postgres Changes only works
 * when Supabase's own Postgres is what's being written to.
 *
 * `subscribe` runs the Supabase client's WebSocket connection, which
 * works from Node (server) or the browser (client) alike — this module
 * itself isn't client-only, even though `app/lib/notes-realtime.ts`
 * (sibling fragment file) only ever calls `subscribe` from a component.
 *
 * `fixed interface (PRD.md §9)`: `subscribe(channel, handler) →
 * unsubscribe`, `publish(channel, payload) → void`.
 */
import { supabase } from "~/server/supabase-client";

export function subscribe(channel: string, handler: (payload: unknown) => void): () => void {
  const realtimeChannel = supabase
    .channel(channel)
    .on("broadcast", { event: "message" }, (message) => handler(message.payload))
    .subscribe();

  return () => {
    void supabase.removeChannel(realtimeChannel);
  };
}

export async function publish(channel: string, payload: unknown): Promise<void> {
  const realtimeChannel = supabase.channel(channel);
  await new Promise<void>((resolve) => {
    realtimeChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        resolve();
      }
    });
  });
  await realtimeChannel.send({ type: "broadcast", event: "message", payload });
  await supabase.removeChannel(realtimeChannel);
}
