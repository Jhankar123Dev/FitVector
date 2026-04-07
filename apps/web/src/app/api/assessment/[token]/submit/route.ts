import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitAssessmentSchema } from "@/lib/validators";
import { autoGradeMCQ } from "@/lib/assessment-helpers";

// ─── POST: Submit assessment answers (public) ────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const parsed = submitAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch submission + assessment
    const { data: submission } = await supabase
      .from("assessment_submissions")
      .select(`
        id, status, started_at, applicant_id,
        assessments (assessment_type, time_limit_minutes, questions)
      `)
      .eq("id", token)
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (submission.status !== "started") {
      return NextResponse.json(
        { error: `Cannot submit: status is '${submission.status}'` },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assessment = (submission as any).assessments;
    const now = new Date();
    const startedAt = new Date(submission.started_at!);
    const elapsedMinutes = (now.getTime() - startedAt.getTime()) / 60000;
    const timeLimit = assessment?.time_limit_minutes || null;

    // Build structured proctoring flags object
    const isLate = !!(timeLimit && elapsedMinutes > timeLimit + 2);
    const proctoringFlags = {
      tabSwitches: parsed.data.proctoringData?.tabSwitches ?? 0,
      copyPasteAttempts: parsed.data.proctoringData?.copyPasteAttempts ?? 0,
      submittedLate: isLate,
      lateByMinutes: isLate ? Math.round(elapsedMinutes - timeLimit!) : 0,
      flagged: isLate
        || (parsed.data.proctoringData?.tabSwitches ?? 0) >= 3
        || (parsed.data.proctoringData?.copyPasteAttempts ?? 0) >= 2,
    };

    // Build update
    const update: Record<string, unknown> = {
      status: "submitted",
      submitted_at: now.toISOString(),
      time_taken_minutes: Math.round(elapsedMinutes),
      answers: parsed.data.answers,
      proctoring_flags: proctoringFlags,
    };

    // Auto-grade MCQ assessments
    const assessmentType = assessment?.assessment_type as string;
    let gradedAnswersForResponse: Array<{ questionId: string; isCorrect: boolean; pointsEarned: number; pointsMax: number }> = [];
    if (assessmentType === "mcq_quiz") {
      const questions = (assessment?.questions || []) as Array<{ id: string; correctAnswer?: string; points?: number }>;
      const { score, gradedAnswers } = autoGradeMCQ(questions, parsed.data.answers);
      update.auto_score = score;
      update.final_score = score;
      gradedAnswersForResponse = gradedAnswers;
      // Merge grading info into answers
      update.answers = parsed.data.answers.map((a) => {
        const graded = gradedAnswers.find((g) => g.questionId === a.questionId);
        return {
          ...a,
          isCorrect: graded?.isCorrect || false,
          pointsEarned: graded?.pointsEarned || 0,
          pointsMax: graded?.pointsMax || 0,
        };
      });
    }
    // Coding, case study, assignment → manual grading (no auto_score)

    const { data: updated, error } = await supabase
      .from("assessment_submissions")
      .update(update)
      .eq("id", token)
      .select("id, status, auto_score, final_score")
      .single();

    if (error || !updated) {
      console.error("Assessment submit error:", error);
      return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }

    // Advance applicant to 'assessment_completed' pipeline stage
    if (submission.applicant_id) {
      await supabase
        .from("applicants")
        .update({ pipeline_stage: "assessment_completed" })
        .eq("id", submission.applicant_id);
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        autoScore: updated.auto_score,
        finalScore: updated.final_score,
        timeTaken: Math.round(elapsedMinutes),
        wasLate: proctoringFlags.submittedLate,
        // Per-question grading so the results screen can show correct/incorrect
        gradedAnswers: gradedAnswersForResponse,
      },
      message: "Assessment submitted successfully",
    });
  } catch (error) {
    console.error("Assessment submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
