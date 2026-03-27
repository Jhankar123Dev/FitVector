import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripCorrectAnswers } from "@/lib/assessment-helpers";

// ─── GET: Get assessment info + questions for candidate (public) ─────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: submission, error } = await supabase
      .from("assessment_submissions")
      .select(`
        id, status, started_at, invited_at,
        applicants (name),
        assessments (name, assessment_type, time_limit_minutes, difficulty, passing_score, questions, settings),
        job_posts (title)
      `)
      .eq("id", token)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (submission.status === "expired") {
      return NextResponse.json({ error: "Assessment has expired" }, { status: 410 });
    }
    if (submission.status === "submitted" || submission.status === "graded") {
      return NextResponse.json({ error: "Assessment has already been submitted" }, { status: 410 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = submission as any;
    const assessment = r.assessments;

    return NextResponse.json({
      data: {
        id: submission.id,
        status: submission.status,
        startedAt: submission.started_at,
        candidateName: r.applicants?.name || "Candidate",
        assessmentName: assessment?.name || "",
        assessmentType: assessment?.assessment_type || "",
        jobTitle: r.job_posts?.title || "",
        timeLimitMinutes: assessment?.time_limit_minutes || null,
        difficulty: assessment?.difficulty || null,
        passingScore: assessment?.passing_score || null,
        // CRITICAL: Strip correct answers before sending to candidate!
        questions: stripCorrectAnswers(assessment?.questions || []),
        settings: assessment?.settings || {},
        questionCount: (assessment?.questions || []).length,
      },
    });
  } catch (error) {
    console.error("Assessment GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
