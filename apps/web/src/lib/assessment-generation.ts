/**
 * assessment-generation.ts
 *
 * Auto-generates AI questions and creates/updates an `assessments` record
 * for a job post whenever it's published with assessmentConfig enabled.
 *
 * Called from:
 *   - POST /api/employer/jobs      (new job published immediately)
 *   - PUT  /api/employer/jobs/[id] (existing job updated to active)
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface AssessmentConfig {
  enabled: boolean;
  assessmentType: string;       // "mixed" | "mcq_quiz" | "coding_test" | ...
  timeLimit: number;            // minutes
  difficultyLevel: string;      // "easy" | "medium" | "hard"
  customQuestions: string[];    // topic strings
  mcqCount?: number;
  codingCount?: number;
  codeLanguage?: string;
}

/**
 * Derive how many MCQ + coding questions to generate from the assessmentConfig.
 */
function deriveQuestionCounts(cfg: AssessmentConfig): { mcq: number; coding: number } {
  const type = cfg.assessmentType;
  if (type === "mixed") {
    return {
      mcq:    cfg.mcqCount    ?? 30,
      coding: cfg.codingCount ?? 2,
    };
  }
  if (type === "mcq_quiz") {
    return { mcq: cfg.mcqCount ?? 20, coding: 0 };
  }
  if (type === "coding_test") {
    return { mcq: 0, coding: cfg.codingCount ?? 2 };
  }
  // case_study / assignment — no AI generation needed
  return { mcq: 0, coding: 0 };
}

/**
 * Call the AI engine to generate questions, then create an `assessments` row
 * and write `assessment_id` back to the job post.
 *
 * Non-throwing — logs errors but never breaks the job create/update flow.
 */
export async function generateAndLinkAssessment(
  supabase: SupabaseClient,
  jobPostId: string,
  companyId: string,
  userId: string,
  jobTitle: string,
  assessmentConfig: AssessmentConfig,
): Promise<string | null> {
  try {
    const { mcq, coding } = deriveQuestionCounts(assessmentConfig);
    if (mcq === 0 && coding === 0) return null;

    const topic = assessmentConfig.customQuestions.join(", ") || jobTitle;
    const difficulty = assessmentConfig.difficultyLevel || "medium";
    const codeLanguage = assessmentConfig.codeLanguage || "python3";
    const aiUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";

    // Fire both generation requests in parallel
    const [mcqRes, codingRes] = await Promise.all([
      mcq > 0
        ? fetch(`${aiUrl}/ai/generate-questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              questionType: "multiple_choice",
              difficulty,
              count: mcq,
            }),
          }).then((r) => r.json()).catch(() => ({ questions: [] }))
        : Promise.resolve({ questions: [] }),

      coding > 0
        ? fetch(`${aiUrl}/ai/generate-questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              questionType: "code",
              difficulty,
              count: coding,
              codeLanguage,
            }),
          }).then((r) => r.json()).catch(() => ({ questions: [] }))
        : Promise.resolve({ questions: [] }),
    ]);

    const questions = [
      ...(mcqRes.questions ?? []),
      ...(codingRes.questions ?? []),
    ];

    if (questions.length === 0) {
      console.warn("[generateAndLinkAssessment] AI returned 0 questions — skipping assessment creation");
      return null;
    }

    // Create the assessments record
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .insert({
        company_id:          companyId,
        created_by:          userId,
        name:                `${jobTitle} — Assessment`,
        assessment_type:     assessmentConfig.assessmentType,
        time_limit_minutes:  assessmentConfig.timeLimit ?? 60,
        difficulty,
        passing_score:       60,
        questions,
        settings: {
          randomizeQuestions:      true,
          showResultsToCandidate:  false,
          maxAttempts:             1,
        },
        is_template: false,
      })
      .select("id")
      .single();

    if (aErr || !assessment) {
      console.error("[generateAndLinkAssessment] Failed to insert assessment:", aErr);
      return null;
    }

    // Link assessment back to job post
    await supabase
      .from("job_posts")
      .update({ assessment_id: assessment.id })
      .eq("id", jobPostId);

    console.log(`[generateAndLinkAssessment] Created assessment ${assessment.id} for job ${jobPostId} (${mcq} MCQ + ${coding} coding)`);
    return assessment.id;
  } catch (err) {
    console.error("[generateAndLinkAssessment] Unexpected error:", err);
    return null;
  }
}
