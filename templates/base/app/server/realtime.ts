/**
 * Realtime server interface — fixed shape across every realtime provider fragment.
 *
 * No realtime provider is selected in the base template, so every export below
 * throws at call time. A provider fragment (e.g. `providers/realtime/supabase`)
 * replaces this file wholesale with a real implementation of the same shape.
 */

export type Unsubscribe = () => void;

export type RealtimeHandler = (payload: unknown) => void;

function notConfigured(): never {
  throw new Error(
    "No realtime provider configured. Select a realtime provider when scaffolding " +
      "this app to replace app/server/realtime.ts with a working implementation.",
  );
}

export function subscribe(_channel: string, _handler: RealtimeHandler): Unsubscribe {
  return notConfigured();
}

export function publish(_channel: string, _payload: unknown): void {
  notConfigured();
}
