import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { updateJobPostSchema } from "@/lib/validators";
import { transformJobPost } from "@/lib/job-post-helpers";

// ─── GET: Single job post ────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: row, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", id)
      .eq("company_id", company.id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    return NextResponse.json({ data: transformJobPost(row) });
  } catch (error) {
    console.error("Job GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Update job post ────────────────────────────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id } = await params;
    const body = await req.json();
    const parsed = updateJobPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify job belongs to company
    const { data: existing } = await supabase
      .from("job_posts")
      .select("id, status")
      .eq("id", id)
      .eq("company_id", company.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    // Build snake_case update
    const d = parsed.data;
    const update: Record<string, unknown> = {};
    if (d.title !== undefined) update.title = d.title;
    if (d.department !== undefined) update.department = d.department;
    if (d.location !== undefined) update.location = d.location;
    if (d.isRemote !== undefined) update.is_remote = d.isRemote;
    if (d.workMode !== undefined) update.work_mode = d.workMode;
    if (d.jobType !== undefined) update.job_type = d.jobType;
    if (d.experienceMin !== undefined) update.experience_min = d.experienceMin;
    if (d.experienceMax !== undefined) update.experience_max = d.experienceMax;
    if (d.salaryMin !== undefined) update.salary_min = d.salaryMin;
    if (d.salaryMax !== undefined) update.salary_max = d.salaryMax;
    if (d.salaryCurrency !== undefined) update.salary_currency = d.salaryCurrency;
    if (d.salaryVisible !== undefined) update.salary_visible = d.salaryVisible;
    if (d.description !== undefined) update.description = d.description;
    if (d.requiredSkills !== undefined) update.required_skills = d.requiredSkills;
    if (d.niceToHaveSkills !== undefined) update.nice_to_have_skills = d.niceToHaveSkills;
    if (d.screeningQuestions !== undefined) update.screening_questions = d.screeningQuestions;
    if (d.openingsCount !== undefined) update.openings_count = d.openingsCount;
    if (d.applicationDeadline !== undefined) update.application_deadline = d.applicationDeadline;
    if (d.interviewPlan !== undefined) update.interview_plan = d.interviewPlan;
    if (d.assessmentConfig !== undefined) update.assessment_config = d.assessmentConfig;
    if (d.autoAdvanceThreshold !== undefined) update.auto_advance_threshold = d.autoAdvanceThreshold;
    if (d.autoRejectThreshold !== undefined) update.auto_reject_threshold = d.autoRejectThreshold;
    if (d.dimensionWeights !== undefined) update.dimension_weights = d.dimensionWeights;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ data: transformJobPost(existing), message: "No changes" });
    }

    const { data: updated, error: updateError } = await supabase
      .from("job_posts")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Job update error:", updateError);
      return NextResponse.json({ error: "Failed to update job post" }, { status: 500 });
    }

    return NextResponse.json({
      data: transformJobPost(updated),
      message: "Job post updated",
    });
  } catch (error) {
    console.error("Job PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
