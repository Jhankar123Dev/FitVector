import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformSubmission } from "@/lib/assessment-helpers";

// ─── GET: Single submission detail ───────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: row, error } = await supabase
      .from("assessment_submissions")
      .select(`
        *,
        applicants (name, email),
        assessments (name, assessment_type, questions, company_id)
      `)
      .eq("id", id)
      .single();

    if (error || !row) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    if (r.assessments?.company_id !== company.id) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...transformSubmission(row, r.applicants || {}, r.assessments || {}),
        questions: r.assessments?.questions || [],
      },
    });
  } catch (error) {
    console.error("Submission GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
