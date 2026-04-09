import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

// ─── GET: All assessment submissions for a specific applicant ─────────────────
//
// Returns every test the candidate has been assigned (across all rounds),
// including score, proctoring flags, time taken, and test case results.
// Lazy-loaded — only fetched when the employer opens the Assessment tab.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id: applicantId } = await params;
    const supabase = createAdminClient();

    // Verify applicant belongs to a job post owned by this company
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, job_post_id")
      .eq("id", applicantId)
      .single();

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("id")
      .eq("id", applicant.job_post_id)
      .eq("company_id", company.id)
      .single();

    if (!jobPost) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all submissions for this applicant, joined with assessment metadata
    const { data: rows, error } = await supabase
      .from("assessment_submissions")
      .select(`
        id,
        assessment_id,
        applicant_id,
        job_post_id,
        status,
        invited_at,
        started_at,
        submitted_at,
        graded_at,
        time_taken_minutes,
        auto_score,
        manual_score,
        final_score,
        proctoring_flags,
        plagiarism_flag,
        grader_notes,
        answers,
        created_at,
        assessments (
          id,
          name,
          assessment_type,
          time_limit_minutes,
          difficulty,
          passing_score,
          questions
        )
      `)
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: true }); // chronological — round 1 first

    if (error) {
      console.error("Applicant assessments fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
    }

    const submissions = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      const assessment = r.assessments || {};

      // proctoring_flags is stored as an object {tabSwitches, copyPasteAttempts, ...}
      const pf = (r.proctoring_flags as Record<string, unknown>) || {};

      const score = (r.final_score as number | null) ?? (r.auto_score as number | null) ?? null;

      // Determine pass/fail against passing_score threshold
      const passingScore = (assessment.passing_score as number | null) ?? null;
      const passed = score !== null && passingScore !== null ? score >= passingScore : null;

      // Compute graded MCQ answer breakdown if available
      const answers = (r.answers as Array<{ questionId: string; selectedAnswer?: string; isCorrect?: boolean; pointsEarned?: number; pointsMax?: number }>) || [];
      const questions = (assessment.questions as Array<{ id: string; type?: string; points?: number }>) || [];
      const totalQuestions = questions.length;
      const answeredQuestions = answers.filter((a) => a.selectedAnswer !== undefined && a.selectedAnswer !== null && a.selectedAnswer !== "").length;

      return {
        id: row.id as string,
        assessmentId: row.assessment_id as string,
        assessmentName: (assessment.name as string) || "Unnamed Assessment",
        assessmentType: (assessment.assessment_type as string) || "unknown",
        timeLimitMinutes: (assessment.time_limit_minutes as number) || null,
        difficulty: (assessment.difficulty as string) || null,
        passingScore,
        totalQuestions,
        answeredQuestions,

        // Status & timing
        status: (row.status as string) || "invited",
        invitedAt: (row.invited_at as string) || null,
        startedAt: (row.started_at as string) || null,
        submittedAt: (row.submitted_at as string) || null,
        gradedAt: (row.graded_at as string) || null,
        timeTakenMinutes: (row.time_taken_minutes as number) || null,

        // Score
        autoScore: (row.auto_score as number) ?? null,
        manualScore: (row.manual_score as number) ?? null,
        finalScore: score,
        passed,

        // Proctoring
        proctoring: {
          tabSwitches: (pf.tabSwitches as number) ?? 0,
          copyPasteAttempts: (pf.copyPasteAttempts as number) ?? 0,
          submittedLate: (pf.submittedLate as boolean) ?? false,
          lateByMinutes: (pf.lateByMinutes as number) ?? 0,
          flagged: (pf.flagged as boolean) ?? false,
        },

        plagiarismFlag: (row.plagiarism_flag as boolean) || false,
        graderNotes: (row.grader_notes as string) || null,

        createdAt: row.created_at as string,
      };
    });

    return NextResponse.json({ data: submissions });
  } catch (error) {
    console.error("Applicant assessments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
