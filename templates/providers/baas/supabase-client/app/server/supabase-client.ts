/**
 * Shared Supabase client — the one place `@supabase/supabase-js` is
 * imported in this project. Every layer that picks Supabase for part of
 * its stack (database, auth, storage, realtime) reuses this client instead
 * of creating its own, so routes and other server modules import the
 * helpers below rather than `@supabase/supabase-js` directly.
 *
 * Uses the anon (public) key, suitable for code that runs with the current
 * user's permissions under Row Level Security. If a later layer needs an
 * elevated service-role client (e.g. server-side admin tasks), add it here
 * as a second export rather than creating a second ad hoc client elsewhere.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
