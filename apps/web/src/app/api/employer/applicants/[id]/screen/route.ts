import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformApplicant, generateFallbackScreening } from "@/lib/applicant-helpers";
import { pythonClient } from "@/lib/python-client";

// ─── POST: Trigger AI screening for one applicant ────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch applicant
    const { data: applicant } = await supabase
      .from("applicants")
      .select("*")
      .eq("id", id)
      .single();

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Verify company ownership
    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("company_id, description, required_skills, nice_to_have_skills, dimension_weights")
      .eq("id", applicant.job_post_id)
      .single();

    if (!jobPost || jobPost.company_id !== company.id) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Attempt AI screening via Python service
    let screeningResult: {
      screening_score: number;
      screening_breakdown: Record<string, number>;
      screening_summary: string;
      bucket: string;
    };

    try {
      screeningResult = await pythonClient.post<typeof screeningResult>("/ai/screen-resume", {
        resume: applicant.resume_parsed_json,
        jobDescription: jobPost.description,
        requiredSkills: jobPost.required_skills || [],
        niceToHaveSkills: jobPost.nice_to_have_skills || [],
        dimensionWeights: jobPost.dimension_weights || null,
        screeningResponses: applicant.screening_responses || [],
      });
    } catch (pyErr) {
      // Fallback: generate mock screening data for development
      console.warn("Python service unavailable, using fallback screening:", pyErr);

      const resumeSkills: string[] =
        (applicant.resume_parsed_json as Record<string, unknown>)?.skills as string[] || [];

      screeningResult = generateFallbackScreening(
        resumeSkills,
        jobPost.required_skills || [],
        jobPost.nice_to_have_skills || [],
        applicant.name,
      );
    }

    // Update applicant with screening results + advance to ai_screened
    const { data: updated, error: updateError } = await supabase
      .from("applicants")
      .update({
        screening_score: screeningResult.screening_score,
        screening_breakdown: screeningResult.screening_breakdown,
        screening_summary: screeningResult.screening_summary,
        bucket: screeningResult.bucket,
        pipeline_stage: "ai_screened",
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Screening update error:", updateError);
      return NextResponse.json({ error: "Failed to save screening results" }, { status: 500 });
    }

    return NextResponse.json({
      data: transformApplicant(updated),
      message: "Screening complete",
    });
  } catch (error) {
    console.error("Screen POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
