import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { createAssessmentSchema } from "@/lib/validators";
import { transformAssessment } from "@/lib/assessment-helpers";

// ─── POST: Create assessment ─────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company, session } = result.data;
    const body = await req.json();
    const parsed = createAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createAdminClient();
    const d = parsed.data;

    const { data: row, error } = await supabase
      .from("assessments")
      .insert({
        company_id: company.id,
        created_by: session.user.id,
        name: d.name,
        assessment_type: d.assessmentType,
        time_limit_minutes: d.timeLimitMinutes ?? null,
        difficulty: d.difficulty ?? null,
        passing_score: d.passingScore ?? null,
        questions: d.questions,
        settings: d.settings,
        is_template: d.isTemplate,
      })
      .select("*")
      .single();

    if (error || !row) {
      console.error("Assessment create error:", error);
      return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
    }

    return NextResponse.json({ data: transformAssessment(row), message: "Assessment created" }, { status: 201 });
  } catch (error) {
    console.error("Assessment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET: List company's assessments ─────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    let query = supabase
      .from("assessments")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (type && type !== "all") {
      query = query.eq("assessment_type", type);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Assessments fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
    }

    return NextResponse.json({ data: (rows || []).map(transformAssessment) });
  } catch (error) {
    console.error("Assessments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
