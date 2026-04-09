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

    // ── Auto-grading ──────────────────────────────────────────────────────────
    const assessmentType = assessment?.assessment_type as string;
    const allQuestions = (assessment?.questions || []) as Array<{
      id: string;
      type?: string;
      correctAnswer?: string;
      points?: number;
    }>;
    let gradedAnswersForResponse: Array<{ questionId: string; isCorrect: boolean; pointsEarned: number; pointsMax: number }> = [];

    const isMCQType    = assessmentType === "mcq_quiz";
    const isMixedType  = assessmentType === "mixed";
    const isCodingType = assessmentType === "coding_test";

    if (isMCQType || isMixedType) {
      // Separate MCQ questions from coding questions
      const mcqQuestions    = isMCQType ? allQuestions : allQuestions.filter((q) => q.type === "multiple_choice" || q.type === "true_false");
      const codingQuestions = isMixedType ? allQuestions.filter((q) => q.type === "code") : [];

      // Grade MCQ
      const { score: mcqScore, gradedAnswers: mcqGraded } = autoGradeMCQ(mcqQuestions, parsed.data.answers);
      gradedAnswersForResponse = mcqGraded;

      // Grade coding via client-submitted testResults
      let codingEarned = 0;
      let codingMax    = 0;
      const codingGraded: typeof gradedAnswersForResponse = [];

      for (const cq of codingQuestions) {
        const pts = cq.points || 1;
        codingMax += pts;

        // Client submits coding answers as JSON string: { code, testResults: [{passed},...] }
        const rawAns = parsed.data.answers.find((a) => a.questionId === cq.id);
        let passedCount = 0;
        let totalCount  = 0;
        try {
          const parsed2 = JSON.parse(rawAns?.selectedAnswer || "{}") as { testResults?: { passed: boolean }[] };
          totalCount  = parsed2.testResults?.length ?? 0;
          passedCount = parsed2.testResults?.filter((r) => r.passed).length ?? 0;
        } catch { /* no test results submitted */ }

        const earned     = totalCount > 0 ? Math.round((passedCount / totalCount) * pts) : 0;
        codingEarned    += earned;

        codingGraded.push({
          questionId:   cq.id,
          isCorrect:    totalCount > 0 && passedCount === totalCount,
          pointsEarned: earned,
          pointsMax:    pts,
        });
      }

      gradedAnswersForResponse = [...mcqGraded, ...codingGraded];

      // Compute blended score (0-100)
      const mcqMax = mcqQuestions.reduce((s, q) => s + (q.points || 1), 0);
      const totalMax    = mcqMax + codingMax;
      const mcqEarned   = mcqQuestions.reduce((s, q) => {
        const g = mcqGraded.find((g2) => g2.questionId === q.id);
        return s + (g?.pointsEarned ?? 0);
      }, 0);
      const totalEarned = mcqEarned + codingEarned;
      const blendedScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : mcqScore;

      update.auto_score  = blendedScore;
      update.final_score = blendedScore;
      update.answers = parsed.data.answers.map((a) => {
        const graded = gradedAnswersForResponse.find((g) => g.questionId === a.questionId);
        return { ...a, isCorrect: graded?.isCorrect || false, pointsEarned: graded?.pointsEarned || 0, pointsMax: graded?.pointsMax || 0 };
      });
    } else if (isCodingType) {
      // Pure coding assessment — score from client testResults
      let codingEarned = 0;
      let codingMax    = 0;

      for (const cq of allQuestions) {
        const pts = cq.points || 1;
        codingMax += pts;
        const rawAns = parsed.data.answers.find((a) => a.questionId === cq.id);
        let passedCount = 0;
        let totalCount  = 0;
        try {
          const p2 = JSON.parse(rawAns?.selectedAnswer || "{}") as { testResults?: { passed: boolean }[] };
          totalCount  = p2.testResults?.length ?? 0;
          passedCount = p2.testResults?.filter((r) => r.passed).length ?? 0;
        } catch { /* no results */ }
        const earned = totalCount > 0 ? Math.round((passedCount / totalCount) * pts) : 0;
        codingEarned += earned;
        gradedAnswersForResponse.push({
          questionId:   cq.id,
          isCorrect:    totalCount > 0 && passedCount === totalCount,
          pointsEarned: earned,
          pointsMax:    pts,
        });
      }
      const score = codingMax > 0 ? Math.round((codingEarned / codingMax) * 100) : 0;
      update.auto_score  = score;
      update.final_score = score;
    }
    // case_study / assignment → manual grading (no auto_score)

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
      const { error: stageErr } = await supabase
        .from("applicants")
        .update({ pipeline_stage: "assessment_completed" })
        .eq("id", submission.applicant_id);
      if (stageErr) {
        console.error(
          `[assessment/submit] Failed to advance pipeline stage for applicant ${submission.applicant_id}:`,
          stageErr,
        );
      }
    } else {
      console.warn(
        `[assessment/submit] Submission ${token} has no applicant_id — pipeline stage not updated`,
      );
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
