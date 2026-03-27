import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformSubmission } from "@/lib/assessment-helpers";

// ─── GET: List submissions for an assessment ─────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id: assessmentId } = await params;
    const supabase = createAdminClient();

    // Verify assessment belongs to company
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, company_id, name, assessment_type")
      .eq("id", assessmentId)
      .eq("company_id", company.id)
      .single();

    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    // Fetch submissions with applicant info
    const { data: rows, error } = await supabase
      .from("assessment_submissions")
      .select(`
        *,
        applicants (name, email)
      `)
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Results fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
    }

    const submissions = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      return transformSubmission(row, r.applicants || {}, assessment);
    });

    return NextResponse.json({ data: submissions });
  } catch (error) {
    console.error("Results GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
