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
      .eq("feature", "cold_email")
      .gte("created_at", `${monthStart}T00:00:00Z`);

    if (!hasQuota(planTier, "cold_email", count || 0)) {
      return Response.json({ error: "Monthly cold email limit reached.", upgrade: true }, { status: 429 });
    }

    const body = await req.json();
    const { jobTitle, companyName, jobDescription, recruiterName, tone } = body;

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

    // Extract useful context from parsed resume JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedResume = (profile?.parsed_resume_json as any) || null;
    const latestRole = parsedResume?.experience?.[0];
    const experienceSummary = latestRole
      ? `${latestRole.title || ""} at ${latestRole.company || ""}`.trim()
      : profile?.target_roles?.[0] || "";

    // Compute skills intersection with job description for personalization
    const userSkills: string[] = profile?.skills || [];
    const jobDescLower = (jobDescription || "").toLowerCase();
    const matchedSkills = userSkills.filter((s) => jobDescLower.includes(s.toLowerCase())).slice(0, 8);

    const result = await pythonClient.post<{
      subject: string | null;
      subject_alternatives: string[] | null;
      body: string;
      personalization_points: string[];
    }>("/ai/cold-email", {
      user_profile: {
        name: user?.full_name || "Candidate",
        skills: userSkills,
        matched_skills: matchedSkills,
        experience_summary: experienceSummary,
        current_title: latestRole?.title || null,
        current_company: latestRole?.company || null,
        years_of_experience: parsedResume?.total_experience_years || null,
        target_roles: profile?.target_roles || [],
      },
      job: {
        title: jobTitle,
        company_name: companyName,
        description: jobDescription?.slice(0, 1500) || "",
      },
      outreach_type: "cold_email",
      tone: tone || "professional",
      recruiter_name: recruiterName || null,
    }, { timeout: 30000 });

    // Store generated outreach
    const { data: outreach } = await supabase
      .from("generated_outreach")
      .insert({
        user_id: userId,
        outreach_type: "cold_email",
        subject: result.subject,
        body: result.body,
        tone: tone || "professional",
        recruiter_name: recruiterName || null,
        job_title: jobTitle || null,
        company_name: companyName || null,
      })
      .select("id")
      .single();

    await supabase.from("usage_logs").insert({
      user_id: userId,
      feature: "cold_email",
      metadata: { company: companyName, job_title: jobTitle },
    });

    return Response.json({
      data: {
        id: outreach?.id,
        subject: result.subject,
        subjectAlternatives: result.subject_alternatives || [],
        body: result.body,
        personalizationPoints: result.personalization_points,
      },
    });
  } catch (error) {
    console.error("Cold email error:", error);
    return Response.json({ error: "Failed to generate cold email" }, { status: 500 });
  }
}
