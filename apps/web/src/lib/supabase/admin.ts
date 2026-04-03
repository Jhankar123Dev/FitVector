import { createClient } from "@supabase/supabase-js";

// ── Singleton admin client ────────────────────────────────────────────────────
// Re-use a single client across all API routes in the same process.
// Creating a new client per request wastes connections and adds latency.

let _adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return _adminClient;
}
