import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { updateAssessmentSchema } from "@/lib/validators";
import { transformAssessment } from "@/lib/assessment-helpers";

// ─── GET: Single assessment detail ───────────────────────────────────────────

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
      .from("assessments")
      .select("*")
      .eq("id", id)
      .eq("company_id", company.id)
      .single();

    if (error || !row) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    return NextResponse.json({ data: transformAssessment(row) });
  } catch (error) {
    console.error("Assessment GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Update assessment ──────────────────────────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id } = await params;
    const body = await req.json();
    const parsed = updateAssessmentSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();
    const d = parsed.data;
    const update: Record<string, unknown> = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.assessmentType !== undefined) update.assessment_type = d.assessmentType;
    if (d.timeLimitMinutes !== undefined) update.time_limit_minutes = d.timeLimitMinutes;
    if (d.difficulty !== undefined) update.difficulty = d.difficulty;
    if (d.passingScore !== undefined) update.passing_score = d.passingScore;
    if (d.questions !== undefined) update.questions = d.questions;
    if (d.settings !== undefined) update.settings = d.settings;
    if (d.isTemplate !== undefined) update.is_template = d.isTemplate;

    const { data: updated, error } = await supabase
      .from("assessments")
      .update(update)
      .eq("id", id)
      .eq("company_id", company.id)
      .select("*")
      .single();

    if (error || !updated) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ data: transformAssessment(updated), message: "Assessment updated" });
  } catch (error) {
    console.error("Assessment PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
