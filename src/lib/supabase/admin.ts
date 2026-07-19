import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server code that runs without a signed-in user —
 * the public booking page, emailed cancel/reschedule links, and reminder
 * sending. It bypasses row-level security, so every query in code that uses
 * it MUST filter by clinic_id explicitly. Never import this in client code.
 */
export function createAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — online booking pages need it."
    );
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
