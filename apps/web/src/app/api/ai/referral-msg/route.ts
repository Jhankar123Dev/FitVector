import { auth } from "@/lib/auth";
import { pythonClient } from "@/lib/python-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasQuota } from "@fitvector/shared";
import type { PlanTier } from "@fitvector/shared";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const planTier = (session.user.planTier || "free") as PlanTier;
    const supabase = createAdminClient();

    const monthStart = new Date().toISOString().slice(0, 7) + "-01";
    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "referral_msg")
      .gte("created_at", `${monthStart}T00:00:00Z`);

    if (!hasQuota(planTier, "referral_msg", count || 0)) {
      return Response.json({ error: "Monthly referral message limit reached.", upgrade: true }, { status: 429 });
    }

    const body = await req.json();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("target_roles, skills")
      .eq("user_id", userId)
      .single();

    const { data: user } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    const result = await pythonClient.post<{
      body: string;
      personalization_points: string[];
    }>("/ai/referral-message", {
      user_profile: {
        name: user?.full_name || "Candidate",
        skills: profile?.skills || [],
        relationship_context: body.relationshipContext || "",
      },
      job: {
        title: body.jobTitle,
        company_name: body.companyName,
        description: body.jobDescription?.slice(0, 300) || "",
      },
      outreach_type: "referral_request",
      tone: "professional",
      recruiter_name: body.connectionName || null,
    }, { timeout: 30000 });

    await supabase.from("generated_outreach").insert({
      user_id: userId,
      outreach_type: "referral_request",
      body: result.body,
      recruiter_name: body.connectionName || null,
    });

    await supabase.from("usage_logs").insert({
      user_id: userId,
      feature: "referral_msg",
    });

    return Response.json({
      data: { body: result.body, personalizationPoints: result.personalization_points },
    });
  } catch (error) {
    console.error("Referral msg error:", error);
    return Response.json({ error: "Failed to generate message" }, { status: 500 });
  }
}
