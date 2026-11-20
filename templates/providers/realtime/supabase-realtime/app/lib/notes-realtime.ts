/**
 * Real implementation of the `/notes` live-update seam (ticket 015),
 * replacing the base template's no-op stub. Built entirely on the fixed
 * `subscribe`/`publish` in `~/server/realtime` (sibling file) rather than
 * reaching for Supabase's channel API directly — keeps this file provider
 * agnostic in shape, even though only Supabase Realtime implements it
 * today.
 */
import { useEffect } from "react";
import { useRevalidator } from "react-router";
import { publish, subscribe } from "~/server/realtime";

const NOTES_CHANNEL = "notes";

export function useNotesRealtime(): void {
  const revalidator = useRevalidator();

  useEffect(() => {
    return subscribe(NOTES_CHANNEL, () => revalidator.revalidate());
    // `revalidator` is a stable object from React Router, not expected to
    // change identity across renders; re-subscribing on every change would
    // defeat the point of a persistent channel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export async function notifyNotesChanged(): Promise<void> {
  await publish(NOTES_CHANNEL, {});
}
