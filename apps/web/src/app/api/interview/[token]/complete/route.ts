import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeInterviewSchema } from "@/lib/validators";
import { generateFallbackEvaluation } from "@/lib/interview-helpers";
import { pythonClient } from "@/lib/python-client";

// ─── POST: Submit completed interview (public, no auth) ──────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const parsed = completeInterviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch interview + job post
    const { data: interview } = await supabase
      .from("ai_interviews")
      .select("id, status, applicant_id, job_post_id, interview_type")
      .eq("id", token)
      .single();

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status !== "started") {
      return NextResponse.json(
        { error: `Cannot complete: interview status is '${interview.status}'` },
        { status: 400 }
      );
    }

    // Get job post for context
    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("title, description, required_skills")
      .eq("id", interview.job_post_id)
      .single();

    // Evaluate answers
    let evaluation: ReturnType<typeof generateFallbackEvaluation>;

    try {
      evaluation = await pythonClient.post("/ai/evaluate-interview", {
        answers: parsed.data.answers,
        jobDescription: jobPost?.description || "",
        requiredSkills: jobPost?.required_skills || [],
        interviewType: interview.interview_type,
      });
    } catch {
      // Fallback when Python service is unavailable
      console.warn("Python service unavailable, using fallback evaluation");
      evaluation = generateFallbackEvaluation(
        parsed.data.answers,
        jobPost?.required_skills || [],
        interview.interview_type,
      );
    }

    // Update interview with results
    const { data: updated, error: updateError } = await supabase
      .from("ai_interviews")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_actual: evaluation.duration_actual,
        transcript: evaluation.transcript,
        evaluation_report: evaluation.evaluation_report,
        overall_score: evaluation.overall_score,
        skill_scores: evaluation.skill_scores,
        strengths: evaluation.strengths,
        concerns: evaluation.concerns,
        cheating_confidence: evaluation.cheating_confidence,
        cheating_signals: evaluation.cheating_signals,
        communication_assessment: evaluation.communication_assessment,
        ai_recommendation: evaluation.ai_recommendation,
      })
      .eq("id", token)
      .select("id, status")
      .single();

    if (updateError || !updated) {
      console.error("Interview complete update error:", updateError);
      return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
    }

    // Advance applicant to 'ai_interviewed' stage
    await supabase
      .from("applicants")
      .update({ pipeline_stage: "ai_interviewed" })
      .eq("id", interview.applicant_id);

    return NextResponse.json({
      data: { id: updated.id, status: "completed" },
      message: "Interview completed. Thank you!",
    });
  } catch (error) {
    console.error("Interview complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
