import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { pythonClient } from "@/lib/python-client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobTitle, companyName, description, skillsRequired, requiredExperienceYears } = body;

    if (!description) {
      return Response.json({ error: "Job description is required" }, { status: 400 });
    }

    // Fetch user's parsed resume
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("parsed_resume_json, skills, experience_level")
      .eq("user_id", session.user.id)
      .single();

    if (!profile?.parsed_resume_json) {
      return Response.json(
        { error: "No resume found. Please upload your resume first." },
        { status: 400 },
      );
    }

    // Call Python gap analysis endpoint
    const gapResult = await pythonClient.post<{
      matching_skills: Array<{ skill: string; evidence: string }>;
      missing_skills: Array<{ skill: string; importance: string }>;
      experience_gaps: string[];
      strengths: string[];
      recommendations: string[];
    }>("/ai/gap-analysis", {
      parsed_resume: profile.parsed_resume_json,
      job_title: jobTitle || "Unknown",
      company_name: companyName || "Unknown",
      job_description: description.slice(0, 2000),
      required_skills: skillsRequired || [],
      experience_range: requiredExperienceYears
        ? `${requiredExperienceYears}+ years`
        : "Not specified",
    }, { timeout: 30000 });

    return Response.json({ data: gapResult });
  } catch (error) {
    console.error("Gap analysis error:", error);
    return Response.json(
      { error: "Gap analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
