import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCodeAgainstTestCases, SUPPORTED_LANGUAGES } from "@/lib/jdoodle";

// Re-export for any consumers that imported the type from here
export type { TestCaseResult as CodeExecuteResult } from "@/lib/jdoodle";

// ── Input schema ─────────────────────────────────────────────────────────────
// SECURITY: testCases are NOT accepted from the client. Passing test cases
// from the frontend would allow a candidate to send a single matching pair
// and always receive a "passed" result, forging their score.
//
// Instead, the client sends questionId. The server:
//   1. Validates submissionToken → active "started" submission
//   2. Resolves submission → assessment_id
//   3. Fetches the question's test cases from the assessments.questions JSONB
//   4. Runs only the "visible" test cases (preview subset — max 3)
//   5. Returns results with expectedOutput STRIPPED — candidate sees only
//      their own output and pass/fail, never the expected answer.
const executeSchema = z.object({
  code:            z.string().min(1),
  language:        z.string(),
  questionId:      z.string().min(1),
  // Required: the assessment submission UUID. Must be an active (started) submission.
  // Prevents unauthenticated public abuse of this endpoint and ties every execution
  // to a legitimate, in-progress assessment attempt.
  submissionToken: z.string().uuid("submissionToken must be a valid UUID"),
});

interface RawTestCase {
  input:          string;
  expectedOutput: string;
  visible?:       boolean;
}

export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const parsed = executeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { code, language, questionId, submissionToken } = parsed.data;

    const supabase = createAdminClient();

    // ── Step 1: Validate submission token ────────────────────────────────────
    // Verify the token corresponds to an active (started) submission.
    // This prevents public abuse — only candidates with a live assessment can
    // trigger JDoodle API calls.
    const { data: submission } = await supabase
      .from("assessment_submissions")
      .select("id, status, assessment_id")
      .eq("id", submissionToken)
      .eq("status", "started")
      .single();

    if (!submission) {
      return NextResponse.json(
        { error: "Invalid or expired assessment session" },
        { status: 401 },
      );
    }

    // ── Step 2: Fetch questions from the assessment ──────────────────────────
    const { data: assessment } = await supabase
      .from("assessments")
      .select("questions")
      .eq("id", submission.assessment_id)
      .single();

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // ── Step 3: Find the specific question by id ─────────────────────────────
    const allQuestions = (assessment.questions ?? []) as Array<Record<string, unknown>>;
    const question     = allQuestions.find((q) => q.id === questionId);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found in this assessment" },
        { status: 404 },
      );
    }

    // ── Step 4: Extract preview test cases ───────────────────────────────────
    // Only run "visible" test cases for the live preview. Hidden test cases are
    // used exclusively during server-side grading at submission time.
    // If a question has no explicit visible flag, the first 3 are treated as visible.
    const rawTestCases = (question.testCases ?? []) as RawTestCase[];

    const previewCases = rawTestCases
      .filter((tc) => tc.visible !== false)  // visible: true or undefined → show
      .slice(0, 3);                           // max 3 preview runs = 3 JDoodle credits

    if (previewCases.length === 0) {
      // Graceful fallback — if all are hidden, use the first one only
      const fallback = rawTestCases[0];
      if (!fallback) {
        return NextResponse.json(
          { error: "No preview test cases available for this question" },
          { status: 400 },
        );
      }
      previewCases.push(fallback);
    }

    // ── Step 5: Validate language ────────────────────────────────────────────
    if (!SUPPORTED_LANGUAGES.includes(language as typeof SUPPORTED_LANGUAGES[number])) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Step 6: Execute via shared JDoodle utility ───────────────────────────
    const { results } = await runCodeAgainstTestCases(code, language, previewCases);

    // ── Step 7: Strip expectedOutput before returning to client ─────────────
    // SECURITY: the candidate must never see the expected output — only their
    // actual output and a pass/fail result. This prevents gaming by copy-pasting
    // the expected value as their answer.
    const safeResults = results.map(({ expectedOutput: _stripped, ...safe }) => safe);

    return NextResponse.json({
      data: {
        results:     safeResults,
        passedCount: results.filter((r) => r.passed).length,
        totalCount:  results.length,
        allPassed:   results.every((r) => r.passed),
      },
    });
  } catch (error) {
    console.error("[code/execute] error:", error);
    if (error instanceof Error && error.message.includes("JDOODLE")) {
      return NextResponse.json({ error: "Code execution service not configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
