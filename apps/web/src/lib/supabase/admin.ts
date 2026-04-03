import { createClient } from "@supabase/supabase-js";

// ── Singleton admin client ────────────────────────────────────────────────────
// Re-use a single client across all API routes in the same process.
// Creating a new client per request wastes connections and adds latency.
//
// We derive the singleton type from buildClient() so TypeScript infers it
// identically to a direct createClient() call — keeping full any-typed schema
// support. ReturnType<typeof createClient> alone resolves differently across
// overloads and produces 'never' table types.

function buildClient() {
  return createClient(
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

let _adminClient: ReturnType<typeof buildClient> | undefined;

export function createAdminClient() {
  return (_adminClient ??= buildClient());
}
