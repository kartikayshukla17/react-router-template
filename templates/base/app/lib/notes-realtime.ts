/**
 * `/notes` live-update seam (ticket 015) — fixed shape across every
 * realtime provider fragment, same "stub + override" discipline as
 * `app/server/auth.ts`/`app/server/db.ts`. No realtime provider is
 * selected in the base template, so both exports below are no-ops: the
 * component still renders and the action still succeeds, just without any
 * live update. A provider fragment (e.g. `realtime/supabase-realtime`)
 * replaces this file wholesale with a real implementation.
 *
 * `useNotesRealtime` is called unconditionally from `/notes`'s component
 * (so the call site never needs to know whether realtime was selected);
 * `notifyNotesChanged` is called the same way from `/notes`'s `action`
 * after every create/delete, so some OTHER open tab's subscription has
 * something to react to.
 */

export function useNotesRealtime(): void {}

export async function notifyNotesChanged(): Promise<void> {}
