import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { gradeSubmissionSchema } from "@/lib/validators";
import { transformSubmission } from "@/lib/assessment-helpers";

// ─── PUT: Manual grading ─────────────────────────────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company, session } = result.data;
    const { id } = await params;
    const body = await req.json();
    const parsed = gradeSubmissionSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();

    // Verify submission belongs to company
    const { data: sub } = await supabase
      .from("assessment_submissions")
      .select("id, assessment_id, auto_score, assessments(company_id)")
      .eq("id", id)
      .single();

    if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((sub as any).assessments?.company_id !== company.id) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Compute final score (average of auto + manual if both exist, otherwise just the one provided)
    const autoScore = (sub.auto_score as number) ?? null;
    const manualScore = parsed.data.manualScore;
    const finalScore = autoScore !== null
      ? Math.round((autoScore + manualScore) / 2)
      : manualScore;

    const { data: updated, error } = await supabase
      .from("assessment_submissions")
      .update({
        manual_score: manualScore,
        final_score: finalScore,
        grader_id: session.user.id,
        grader_notes: parsed.data.graderNotes || null,
        graded_at: new Date().toISOString(),
        status: "graded",
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) return NextResponse.json({ error: "Failed to grade" }, { status: 500 });

    return NextResponse.json({ data: transformSubmission(updated), message: "Submission graded" });
  } catch (error) {
    console.error("Grade PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
