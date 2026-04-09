import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCodeAgainstTestCases, SUPPORTED_LANGUAGES } from "@/lib/jdoodle";

// Re-export for any consumers that imported the type from here
export type { TestCaseResult as CodeExecuteResult } from "@/lib/jdoodle";

const executeSchema = z.object({
  code: z.string().min(1),
  language: z.string(),
  testCases: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
    }),
  ).min(1).max(10),
  // Required: the assessment submission UUID. Must be an active (started) submission.
  // Prevents unauthenticated public abuse of this endpoint and ties every execution
  // to a legitimate, in-progress assessment attempt.
  submissionToken: z.string().uuid("submissionToken must be a valid UUID"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { code, language, testCases, submissionToken } = parsed.data;

    // ── Submission token guard ────────────────────────────────────────────────
    // Verify that the token corresponds to an active (started) assessment attempt.
    // This prevents public abuse of the code execution endpoint — only candidates
    // with a live, in-progress assessment can trigger JDoodle API calls.
    const supabase = createAdminClient();
    const { data: submission } = await supabase
      .from("assessment_submissions")
      .select("id, status")
      .eq("id", submissionToken)
      .eq("status", "started")
      .single();

    if (!submission) {
      return NextResponse.json(
        { error: "Invalid or expired assessment session" },
        { status: 401 },
      );
    }

    // Validate language before calling JDoodle
    if (!SUPPORTED_LANGUAGES.includes(language as typeof SUPPORTED_LANGUAGES[number])) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Execute via shared JDoodle utility ────────────────────────────────────
    const { results, allPassed, passedCount, totalCount } =
      await runCodeAgainstTestCases(code, language, testCases);

    return NextResponse.json({ data: { results, allPassed, passedCount, totalCount } });
  } catch (error) {
    console.error("[code/execute] error:", error);
    // Surface JDoodle config errors with a clear 503
    if (error instanceof Error && error.message.includes("JDOODLE")) {
      return NextResponse.json({ error: "Code execution not configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
