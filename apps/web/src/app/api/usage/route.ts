import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@fitvector/shared";
import type { PlanTier } from "@fitvector/shared";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const userId = session.user.id;
    const planTier = (session.user.planTier || "free") as PlanTier;
    const limits = PLAN_LIMITS[planTier];

    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.slice(0, 7) + "-01";

    // Get daily usage counts
    const { count: dailySearchCount } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "job_search")
      .gte("created_at", `${today}T00:00:00Z`);

    // Get monthly usage counts
    const features = [
      "resume_tailor",
      "cold_email",
      "linkedin_msg",
      "referral_msg",
      "email_find",
      "gap_analysis",
    ];

    const monthlyCounts: Record<string, number> = {};
    for (const feature of features) {
      const { count } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("feature", feature)
        .gte("created_at", `${monthStart}T00:00:00Z`);
      monthlyCounts[feature] = count || 0;
    }

    // Active applications count
    const { count: activeApps } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false);

    return Response.json({
      data: {
        plan: planTier,
        month: today.slice(0, 7),
        usage: {
          jobSearch: {
            used: dailySearchCount || 0,
            limit: limits.job_search,
            period: "daily",
          },
          resumeTailor: {
            used: monthlyCounts.resume_tailor || 0,
            limit: limits.resume_tailor,
            period: "monthly",
          },
          coldEmail: {
            used: monthlyCounts.cold_email || 0,
            limit: limits.cold_email,
            period: "monthly",
          },
          linkedinMsg: {
            used: monthlyCounts.linkedin_msg || 0,
            limit: limits.linkedin_msg,
            period: "monthly",
          },
          referralMsg: {
            used: monthlyCounts.referral_msg || 0,
            limit: limits.referral_msg,
            period: "monthly",
          },
          emailFind: {
            used: monthlyCounts.email_find || 0,
            limit: limits.email_find,
            period: "monthly",
          },
          gapAnalysis: {
            used: monthlyCounts.gap_analysis || 0,
            limit: limits.gap_analysis,
            period: "monthly",
          },
          activeApplications: {
            used: activeApps || 0,
            limit: limits.active_applications,
            period: "total",
          },
        },
      },
    });
  } catch (error) {
    console.error("Usage endpoint error:", error);
    return Response.json({ error: "Failed to load usage data" }, { status: 500 });
  }
}
