import type { SupabaseClient } from "@supabase/supabase-js";

interface BankQuestion {
  id: string;
  title: string;
  difficulty: string;
  prompt: string;
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string }[];
  tags: string[];
}

interface AssessmentConfig {
  enabled: boolean;
  assessmentType: string;
  timeLimit: number;
  difficultyLevel: string;
  customQuestions: string[];
  mcqCount?: number;
  codingCount?: number;
  codeLanguage?: string;
  bankQuestions?: BankQuestion[];
}

function deriveQuestionCounts(cfg: AssessmentConfig): { mcq: number; coding: number } {
  const type = cfg.assessmentType;
  if (type === "mixed")       return { mcq: cfg.mcqCount ?? 30, coding: cfg.codingCount ?? 2 };
  if (type === "mcq_quiz")    return { mcq: cfg.mcqCount ?? 20, coding: 0 };
  if (type === "coding_test") return { mcq: 0, coding: cfg.codingCount ?? 2 };
  return { mcq: 0, coding: 0 };
}

/**
 * Create an `assessments` record and write `assessment_id` back to the job post.
 *
 * If `assessmentConfig.bankQuestions` is non-empty the bank items are inserted
 * directly; otherwise questions are AI-generated from the Python engine.
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
    const difficulty = assessmentConfig.difficultyLevel || "medium";
    const bankQs = assessmentConfig.bankQuestions ?? [];

    let questions: unknown[];

    if (bankQs.length > 0) {
      // Use bank questions directly — map to the shared question format
      questions = bankQs.map((item) => ({
        type:         "code",
        id:           item.id,
        title:        item.title,
        prompt:       item.prompt,
        difficulty:   item.difficulty,
        tags:         item.tags,
        starter_code: item.starterCode,
        test_cases:   item.testCases,
        source:       "bank",
      }));
    } else {
      // AI-generate questions from the config
      const { mcq, coding } = deriveQuestionCounts(assessmentConfig);
      if (mcq === 0 && coding === 0) return null;

      const topic = assessmentConfig.customQuestions.join(", ") || jobTitle;
      const codeLanguage = assessmentConfig.codeLanguage || "python3";
      const aiUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";

      const [mcqRes, codingRes] = await Promise.all([
        mcq > 0
          ? fetch(`${aiUrl}/ai/generate-questions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic, questionType: "multiple_choice", difficulty, count: mcq }),
            }).then((r) => r.json()).catch(() => ({ questions: [] }))
          : Promise.resolve({ questions: [] }),

        coding > 0
          ? fetch(`${aiUrl}/ai/generate-questions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic, questionType: "code", difficulty, count: coding, codeLanguage }),
            }).then((r) => r.json()).catch(() => ({ questions: [] }))
          : Promise.resolve({ questions: [] }),
      ]);

      questions = [...(mcqRes.questions ?? []), ...(codingRes.questions ?? [])];

      if (questions.length === 0) {
        console.warn("[generateAndLinkAssessment] AI returned 0 questions — skipping assessment creation");
        return null;
      }
    }

    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .insert({
        company_id:         companyId,
        created_by:         userId,
        name:               `${jobTitle} — Assessment`,
        assessment_type:    assessmentConfig.assessmentType,
        time_limit_minutes: assessmentConfig.timeLimit ?? 60,
        difficulty,
        passing_score:      60,
        questions,
        settings: {
          randomizeQuestions:     true,
          showResultsToCandidate: false,
          maxAttempts:            1,
        },
        is_template: false,
      })
      .select("id")
      .single();

    if (aErr || !assessment) {
      console.error("[generateAndLinkAssessment] Failed to insert assessment:", aErr);
      return null;
    }

    await supabase
      .from("job_posts")
      .update({ assessment_id: assessment.id })
      .eq("id", jobPostId);

    const source = bankQs.length > 0 ? `${bankQs.length} bank questions` : `AI-generated`;
    console.log(`[generateAndLinkAssessment] Created assessment ${assessment.id} for job ${jobPostId} (${source})`);
    return assessment.id;
  } catch (err) {
    console.error("[generateAndLinkAssessment] Unexpected error:", err);
    return null;
  }
}
