import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitAssessmentSchema } from "@/lib/validators";
import { autoGradeMCQ, gradeShortAnswer } from "@/lib/assessment-helpers";
import { runCodeAgainstTestCases } from "@/lib/jdoodle";
import type { TestCase } from "@/lib/jdoodle";

export const maxDuration = 60;

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

    // Fetch submission + assessment (include proctoring_flags for server-side counts)
    const { data: submission } = await supabase
      .from("assessment_submissions")
      .select(`
        id, status, started_at, applicant_id, proctoring_flags,
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

    // ── Build proctoring flags — server-side counts only ─────────────────────
    // tabSwitches and copyPasteAttempts come from the server-accumulated values
    // stored by the /event endpoint (via sendBeacon during the test). We NEVER
    // trust the client-submitted proctoringData for these counts — a candidate
    // could forge { tabSwitches: 0 } in the submit payload to hide activity.
    // The client proctoringData field is intentionally ignored here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serverProctoring = (submission as any).proctoring_flags as {
      tabSwitches?: number;
      copyPasteAttempts?: number;
    } | null;

    const serverTabSwitches       = serverProctoring?.tabSwitches       ?? 0;
    const serverCopyPasteAttempts = serverProctoring?.copyPasteAttempts ?? 0;

    const isLate = !!(timeLimit && elapsedMinutes > timeLimit + 2);
    const proctoringFlags = {
      tabSwitches:      serverTabSwitches,
      copyPasteAttempts: serverCopyPasteAttempts,
      submittedLate:    isLate,
      lateByMinutes:    isLate ? Math.round(elapsedMinutes - timeLimit!) : 0,
      // Flag if late, OR ≥3 tab switches, OR ≥2 copy-paste attempts (all server-computed)
      flagged: isLate || serverTabSwitches >= 3 || serverCopyPasteAttempts >= 2,
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
      testCases?: TestCase[];
      codeLanguage?: string;
    }>;
    let gradedAnswersForResponse: Array<{ questionId: string; isCorrect: boolean; pointsEarned: number; pointsMax: number }> = [];

    const isMCQType    = assessmentType === "mcq_quiz";
    const isMixedType  = assessmentType === "mixed";
    const isCodingType = assessmentType === "coding_test";

    // Track whether any short_answer question needs manual review
    let needsManualReview = false;

    // Capture validated answers in a stable variable so TypeScript can narrow it
    // inside nested async functions without `parsed.data` possibly-undefined error.
    const submittedAnswers = parsed.data.answers;

    // ── Shared server-side coding grader ──────────────────────────────────────
    // SECURITY: We extract only the submitted code string from the answer and
    // re-run it server-side against the test cases stored in the DB.
    // The client-submitted testResults (pass/fail booleans) are intentionally
    // IGNORED — a candidate cannot forge a passing score by manipulating the
    // submit payload.
    async function gradeCodeQuestion(cq: typeof allQuestions[number]): Promise<{
      passedCount: number;
      totalCount: number;
      pointsEarned: number;
    }> {
      const pts = cq.points || 1;
      const rawAns = submittedAnswers.find((a) => a.questionId === cq.id);

      // Extract the candidate's submitted code — ignore any testResults field
      let submittedCode = "";
      try {
        const ansObj = JSON.parse(rawAns?.selectedAnswer || "{}") as { code?: string };
        submittedCode = ansObj.code?.trim() ?? "";
      } catch { /* malformed answer — treat as empty */ }

      const testCases = cq.testCases ?? [];
      if (!submittedCode || testCases.length === 0) {
        return { passedCount: 0, totalCount: testCases.length, pointsEarned: 0 };
      }

      try {
        const result = await runCodeAgainstTestCases(
          submittedCode,
          cq.codeLanguage ?? "python3",
          testCases,
        );
        const earned = result.totalCount > 0
          ? Math.round((result.passedCount / result.totalCount) * pts)
          : 0;
        return { passedCount: result.passedCount, totalCount: result.totalCount, pointsEarned: earned };
      } catch (err) {
        // JDoodle unavailable — log and award 0 rather than blocking submission
        console.error("[submit] server-side code grading failed:", err);
        return { passedCount: 0, totalCount: testCases.length, pointsEarned: 0 };
      }
    }

    if (isMCQType || isMixedType) {
      // ── Bucket questions by type ────────────────────────────────────────────
      const mcqQuestions   = allQuestions.filter((q) => q.type === "multiple_choice" || q.type === "true_false");
      const shortQuestions = allQuestions.filter((q) => q.type === "short_answer");
      // For pure MCQ assessments, coding questions are not expected — but handle gracefully
      const codingQuestions = isMixedType ? allQuestions.filter((q) => q.type === "code") : [];

      // ── Grade MCQ (exact match, server-side) ────────────────────────────────
      const { score: mcqScore, gradedAnswers: mcqGraded } = autoGradeMCQ(mcqQuestions, submittedAnswers);

      // ── Grade short_answer (fuzzy matching) ─────────────────────────────────
      const shortGraded: typeof gradedAnswersForResponse = shortQuestions.map((sq) => {
        const pts    = sq.points || 1;
        const rawAns = submittedAnswers.find((a) => a.questionId === sq.id);
        const { earned, status } = gradeShortAnswer(
          rawAns?.selectedAnswer ?? "",
          sq.correctAnswer ?? "",
          pts,
        );
        if (status === "needs_review") needsManualReview = true;
        return {
          questionId:      sq.id,
          isCorrect:       status === "correct",
          pointsEarned:    earned,
          pointsMax:       pts,
          gradingStatus:   status,   // stored for employer results UI (needs_review badge)
        };
      });

      // ── Grade code server-side (sequential — JDoodle free tier credits) ─────
      let codingEarned = 0;
      let codingMax    = 0;
      const codingGraded: typeof gradedAnswersForResponse = [];

      for (const cq of codingQuestions) {
        const pts = cq.points || 1;
        codingMax += pts;

        const { passedCount, totalCount, pointsEarned } = await gradeCodeQuestion(cq);
        codingEarned += pointsEarned;

        codingGraded.push({
          questionId:   cq.id,
          isCorrect:    totalCount > 0 && passedCount === totalCount,
          pointsEarned,
          pointsMax:    pts,
        });
      }

      gradedAnswersForResponse = [...mcqGraded, ...shortGraded, ...codingGraded];

      // ── Compute blended score (0-100) ────────────────────────────────────────
      const mcqMax    = mcqQuestions.reduce((s, q) => s + (q.points || 1), 0);
      const shortMax  = shortQuestions.reduce((s, q) => s + (q.points || 1), 0);
      const totalMax  = mcqMax + shortMax + codingMax;

      const mcqEarned = mcqQuestions.reduce((s, q) => {
        const g = mcqGraded.find((g2) => g2.questionId === q.id);
        return s + (g?.pointsEarned ?? 0);
      }, 0);
      const shortEarned = shortGraded.reduce((s, g) => s + g.pointsEarned, 0);
      const totalEarned = mcqEarned + shortEarned + codingEarned;

      // If any short_answer needs review, auto_score is provisional (excludes those points)
      const blendedScore = totalMax > 0
        ? Math.round((totalEarned / totalMax) * 100)
        : mcqScore;

      update.auto_score  = blendedScore;
      // Only set final_score if no manual review needed; otherwise employer sets it after review
      if (!needsManualReview) update.final_score = blendedScore;
      update.answers = submittedAnswers.map((a) => {
        const graded = gradedAnswersForResponse.find((g) => g.questionId === a.questionId);
        return {
          ...a,
          isCorrect:     graded?.isCorrect     || false,
          pointsEarned:  graded?.pointsEarned  || 0,
          pointsMax:     graded?.pointsMax      || 0,
          gradingStatus: (graded as Record<string, unknown> | undefined)?.gradingStatus ?? "correct",
        };
      });
    } else if (isCodingType) {
      // Pure coding assessment — re-run all code server-side
      let codingEarned = 0;
      let codingMax    = 0;

      for (const cq of allQuestions) {
        const pts = cq.points || 1;
        codingMax += pts;

        const { passedCount, totalCount, pointsEarned } = await gradeCodeQuestion(cq);
        codingEarned += pointsEarned;

        gradedAnswersForResponse.push({
          questionId:   cq.id,
          isCorrect:    totalCount > 0 && passedCount === totalCount,
          pointsEarned,
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
        id:                updated.id,
        status:            updated.status,
        autoScore:         updated.auto_score,
        finalScore:        updated.final_score,
        timeTaken:         Math.round(elapsedMinutes),
        wasLate:           proctoringFlags.submittedLate,
        needsManualReview,   // true if any short_answer was flagged for employer review
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
