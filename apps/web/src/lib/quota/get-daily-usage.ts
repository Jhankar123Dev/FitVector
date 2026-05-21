import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns how many times a user has used a given feature today (UTC day).
 * Uses idx_usage_logs_user_feature index for fast lookups.
 * Column name is "feature" (NOT "action") — matches usage_logs schema.
 */
export async function getDailyUsage(
  userId: string,
  feature: string,
): Promise<number> {
  const supabase = createAdminClient();
  const dayStart = new Date().toISOString().slice(0, 10) + "T00:00:00Z";

  const { count } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", dayStart);

  return count || 0;
}

/**
 * Logs a single usage event. Call this AFTER the AI response succeeds
 * so failed/errored requests don't count against the user's daily quota.
 */
export async function logUsage(
  userId: string,
  feature: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("usage_logs").insert({ user_id: userId, feature, metadata });
}
