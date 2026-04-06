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
      .eq("feature", "linkedin_msg")
      .gte("created_at", `${monthStart}T00:00:00Z`);

    if (!hasQuota(planTier, "linkedin_msg", count || 0)) {
      return Response.json({ error: "Monthly LinkedIn message limit reached.", upgrade: true }, { status: 429 });
    }

    const body = await req.json();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("target_roles, skills, parsed_resume_json")
      .eq("user_id", userId)
      .single();

    const { data: user } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedResume = (profile?.parsed_resume_json as any) || null;
    const latestRole = parsedResume?.experience?.[0];
    const experienceSummary = latestRole
      ? `${latestRole.title || ""} at ${latestRole.company || ""}`.trim()
      : profile?.target_roles?.[0] || "";
    const userSkills: string[] = profile?.skills || [];
    const jobDescLower = (body.jobDescription || "").toLowerCase();
    const matchedSkills = userSkills.filter((s) => jobDescLower.includes(s.toLowerCase())).slice(0, 8);

    const result = await pythonClient.post<{
      body: string;
      personalization_points: string[];
    }>("/ai/linkedin-message", {
      user_profile: {
        name: user?.full_name || "Candidate",
        skills: userSkills,
        matched_skills: matchedSkills,
        experience_summary: experienceSummary,
        current_title: latestRole?.title || null,
        current_company: latestRole?.company || null,
      },
      job: {
        title: body.jobTitle,
        company_name: body.companyName,
        description: body.jobDescription?.slice(0, 1200) || "",
      },
      outreach_type: "linkedin_inmail",
      tone: body.tone || "professional",
      recruiter_name: body.recruiterName || null,
    }, { timeout: 30000 });

    await supabase.from("generated_outreach").insert({
      user_id: userId,
      outreach_type: "linkedin_message",
      body: result.body,
      tone: body.tone || "professional",
      job_title: body.jobTitle || null,
      company_name: body.companyName || null,
    });

    await supabase.from("usage_logs").insert({
      user_id: userId,
      feature: "linkedin_msg",
      metadata: { company: body.companyName },
    });

    return Response.json({
      data: { body: result.body, personalizationPoints: result.personalization_points },
    });
  } catch (error) {
    console.error("LinkedIn msg error:", error);
    return Response.json({ error: "Failed to generate message" }, { status: 500 });
  }
}
