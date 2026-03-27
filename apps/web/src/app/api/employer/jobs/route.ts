import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { createJobPostSchema } from "@/lib/validators";

// ─── Helper: transform DB row → camelCase JobPost ────────────────────────────

function transformJobPost(row: Record<string, unknown>) {
  return {
    id: row.id,
    companyId: row.company_id,
    createdBy: row.created_by,
    title: row.title,
    department: row.department || null,
    location: row.location || null,
    isRemote: row.is_remote || false,
    workMode: row.work_mode || null,
    jobType: row.job_type || null,
    experienceMin: row.experience_min ?? null,
    experienceMax: row.experience_max ?? null,
    salaryMin: row.salary_min ?? null,
    salaryMax: row.salary_max ?? null,
    salaryCurrency: row.salary_currency || "INR",
    salaryVisible: row.salary_visible ?? true,
    description: row.description,
    requiredSkills: row.required_skills || [],
    niceToHaveSkills: row.nice_to_have_skills || [],
    screeningQuestions: row.screening_questions || [],
    openingsCount: row.openings_count || 1,
    applicationDeadline: row.application_deadline || null,
    interviewPlan: row.interview_plan || null,
    assessmentConfig: row.assessment_config || null,
    status: row.status,
    autoAdvanceThreshold: row.auto_advance_threshold ?? null,
    autoRejectThreshold: row.auto_reject_threshold ?? null,
    dimensionWeights: row.dimension_weights || null,
    viewsCount: row.views_count || 0,
    applicationsCount: row.applications_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── POST: Create a new job post ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company, session } = result.data;
    const body = await req.json();
    const parsed = createJobPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const d = parsed.data;

    // Build snake_case insert
    const insert: Record<string, unknown> = {
      company_id: company.id,
      created_by: session.user.id,
      title: d.title,
      department: d.department || null,
      location: d.location || null,
      is_remote: d.isRemote,
      work_mode: d.workMode || null,
      job_type: d.jobType || null,
      experience_min: d.experienceMin ?? null,
      experience_max: d.experienceMax ?? null,
      salary_min: d.salaryMin ?? null,
      salary_max: d.salaryMax ?? null,
      salary_currency: d.salaryCurrency,
      salary_visible: d.salaryVisible,
      description: d.description,
      required_skills: d.requiredSkills,
      nice_to_have_skills: d.niceToHaveSkills,
      screening_questions: d.screeningQuestions,
      openings_count: d.openingsCount,
      application_deadline: d.applicationDeadline || null,
      interview_plan: d.interviewPlan || null,
      assessment_config: d.assessmentConfig || null,
      status: d.status || "draft",
      auto_advance_threshold: d.autoAdvanceThreshold ?? null,
      auto_reject_threshold: d.autoRejectThreshold ?? null,
      dimension_weights: d.dimensionWeights || null,
    };

    const { data: row, error } = await supabase
      .from("job_posts")
      .insert(insert)
      .select("*")
      .single();

    if (error || !row) {
      console.error("Job post create error:", error);
      return NextResponse.json({ error: "Failed to create job post" }, { status: 500 });
    }

    // If publishing immediately (status === 'active'), also insert into jobs table
    if (d.status === "active") {
      await insertIntoJobsTable(supabase, row, company);
    }

    return NextResponse.json(
      { data: transformJobPost(row), message: "Job post created" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Jobs POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET: List company's job posts ───────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    let query = supabase
      .from("job_posts")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Job posts fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch job posts" }, { status: 500 });
    }

    // For each job post, compute pipeline stage counts from applicants table
    const jobPosts = await Promise.all(
      (rows || []).map(async (row) => {
        const jp = transformJobPost(row);

        // Get pipeline stage counts
        const { data: stageCounts } = await supabase
          .from("applicants")
          .select("pipeline_stage")
          .eq("job_post_id", row.id);

        const stages = stageCounts || [];
        const screenedStages = ["ai_screened", "ai_interviewed", "assessment", "human_interview", "offer", "hired"];
        const interviewedStages = ["ai_interviewed", "human_interview", "offer", "hired"];

        return {
          ...jp,
          // Computed counts for the frontend JobPost type
          screenedCount: stages.filter((s) => screenedStages.includes(s.pipeline_stage)).length,
          interviewedCount: stages.filter((s) => interviewedStages.includes(s.pipeline_stage)).length,
          hiredCount: stages.filter((s) => s.pipeline_stage === "hired").length,
        };
      })
    );

    return NextResponse.json({ data: jobPosts });
  } catch (error) {
    console.error("Jobs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helper: Insert into scraped jobs table on publish ───────────────────────

async function insertIntoJobsTable(
  supabase: ReturnType<typeof createAdminClient>,
  jobPost: Record<string, unknown>,
  company: { id: string; name: string; logoUrl: string | null; websiteUrl: string | null }
) {
  try {
    // Check if a jobs row already exists for this job_post
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("job_post_id", jobPost.id)
      .single();

    if (existing) {
      // Update existing row to active
      await supabase
        .from("jobs")
        .update({ is_active: true })
        .eq("id", existing.id);
      return;
    }

    const title = jobPost.title as string;
    const fingerprint = `fitvector-${jobPost.id}`;

    await supabase.from("jobs").insert({
      source: "fitvector",
      sources: ["fitvector"],
      fingerprint,
      url: `https://fitvector.com/jobs/${jobPost.id}`,
      title,
      company_name: company.name,
      company_logo_url: company.logoUrl || null,
      company_url: company.websiteUrl || null,
      location: jobPost.location || null,
      work_mode: jobPost.work_mode || null,
      job_type: jobPost.job_type || null,
      description: jobPost.description as string,
      skills_required: jobPost.required_skills || [],
      skills_nice_to_have: jobPost.nice_to_have_skills || [],
      experience_min: jobPost.experience_min ?? null,
      experience_max: jobPost.experience_max ?? null,
      salary_min: jobPost.salary_min ?? null,
      salary_max: jobPost.salary_max ?? null,
      salary_currency: jobPost.salary_currency || "INR",
      is_active: true,
      posted_at: new Date().toISOString(),
      job_post_id: jobPost.id,
    });
  } catch (err) {
    // Non-critical — job post is already created, just log
    console.error("Failed to insert into jobs table:", err);
  }
}

export { transformJobPost, insertIntoJobsTable };
