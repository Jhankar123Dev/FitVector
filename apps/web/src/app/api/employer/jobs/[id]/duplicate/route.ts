import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformJobPost } from "../../route";

// ─── POST: Duplicate a job post ──────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company, session } = result.data;
    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch source job post
    const { data: source } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", id)
      .eq("company_id", company.id)
      .single();

    if (!source) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    // Create a duplicate as draft
    const { data: dup, error } = await supabase
      .from("job_posts")
      .insert({
        company_id: company.id,
        created_by: session.user.id,
        title: `${source.title} (Copy)`,
        department: source.department,
        location: source.location,
        is_remote: source.is_remote,
        work_mode: source.work_mode,
        job_type: source.job_type,
        experience_min: source.experience_min,
        experience_max: source.experience_max,
        salary_min: source.salary_min,
        salary_max: source.salary_max,
        salary_currency: source.salary_currency,
        salary_visible: source.salary_visible,
        description: source.description,
        required_skills: source.required_skills,
        nice_to_have_skills: source.nice_to_have_skills,
        screening_questions: source.screening_questions,
        openings_count: source.openings_count,
        application_deadline: null, // Reset deadline
        interview_plan: source.interview_plan,
        assessment_config: source.assessment_config,
        status: "draft", // Always draft
        auto_advance_threshold: source.auto_advance_threshold,
        auto_reject_threshold: source.auto_reject_threshold,
        dimension_weights: source.dimension_weights,
      })
      .select("*")
      .single();

    if (error || !dup) {
      console.error("Duplicate error:", error);
      return NextResponse.json({ error: "Failed to duplicate job" }, { status: 500 });
    }

    return NextResponse.json(
      { data: transformJobPost(dup), message: "Job duplicated as draft" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Duplicate POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
