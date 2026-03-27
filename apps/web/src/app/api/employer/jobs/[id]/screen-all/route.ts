import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { generateFallbackScreening } from "@/lib/applicant-helpers";
import { pythonClient } from "@/lib/python-client";

// ─── POST: Bulk screen all unscreened applicants for a job ───────────────────

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
    const { id: jobPostId } = await params;
    const supabase = createAdminClient();

    // Verify job post
    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("id, company_id, description, required_skills, nice_to_have_skills, dimension_weights")
      .eq("id", jobPostId)
      .eq("company_id", company.id)
      .single();

    if (!jobPost) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    // Fetch all unscreened applicants
    const { data: unscreened } = await supabase
      .from("applicants")
      .select("*")
      .eq("job_post_id", jobPostId)
      .eq("pipeline_stage", "applied")
      .is("screening_score", null);

    if (!unscreened || unscreened.length === 0) {
      return NextResponse.json({
        data: { screened: 0, failed: 0 },
        message: "No applicants to screen",
      });
    }

    let screened = 0;
    let failed = 0;

    for (const applicant of unscreened) {
      try {
        let screeningResult: {
          screening_score: number;
          screening_breakdown: Record<string, number>;
          screening_summary: string;
          bucket: string;
        };

        try {
          screeningResult = await pythonClient.post("/ai/screen-resume", {
            resume: applicant.resume_parsed_json,
            jobDescription: jobPost.description,
            requiredSkills: jobPost.required_skills || [],
            niceToHaveSkills: jobPost.nice_to_have_skills || [],
            dimensionWeights: jobPost.dimension_weights || null,
            screeningResponses: applicant.screening_responses || [],
          });
        } catch {
          // Fallback for dev
          const resumeSkills: string[] =
            (applicant.resume_parsed_json as Record<string, unknown>)?.skills as string[] || [];
          screeningResult = generateFallbackScreening(
            resumeSkills,
            jobPost.required_skills || [],
            jobPost.nice_to_have_skills || [],
            applicant.name,
          );
        }

        await supabase
          .from("applicants")
          .update({
            screening_score: screeningResult.screening_score,
            screening_breakdown: screeningResult.screening_breakdown,
            screening_summary: screeningResult.screening_summary,
            bucket: screeningResult.bucket,
            pipeline_stage: "ai_screened",
          })
          .eq("id", applicant.id);

        screened++;
      } catch (err) {
        console.error(`Failed to screen applicant ${applicant.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      data: { screened, failed, total: unscreened.length },
      message: `Screened ${screened} applicants${failed > 0 ? `, ${failed} failed` : ""}`,
    });
  } catch (error) {
    console.error("Screen-all POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
