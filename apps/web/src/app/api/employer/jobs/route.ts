import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { createJobPostSchema } from "@/lib/validators";
import { transformJobPost, insertIntoJobsTable } from "@/lib/job-post-helpers";
import { generateAndLinkAssessment } from "@/lib/assessment-generation";

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
      // assessment_id links a pre-built assessment so auto-assign works on pipeline drag
      assessment_id: d.assessmentId ?? null,
      // pipeline_stages uses DB default if not provided
      ...(d.pipelineStages ? { pipeline_stages: d.pipelineStages } : {}),
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

    // Insert into public jobs table when publishing immediately
    if (d.status === "active") {
      await insertIntoJobsTable(supabase, row, company);
    }

    // Create and link assessment whenever config is enabled and no existing assessment was linked.
    // Runs for both draft and active so assessment_id is available as soon as the job is saved.
    if (d.assessmentConfig?.enabled && !d.assessmentId) {
      await generateAndLinkAssessment(
        supabase,
        row.id as string,
        company.id,
        session.user.id,
        d.title,
        d.assessmentConfig as Parameters<typeof generateAndLinkAssessment>[5],
      );
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

    // Fetch all applicant pipeline stages for all jobs in ONE query (not N).
    const jobIds = (rows || []).map((r) => r.id);
    let allStageCounts: { job_post_id: string; pipeline_stage: string }[] = [];
    if (jobIds.length) {
      const { data } = await supabase
        .from("applicants")
        .select("job_post_id, pipeline_stage")
        .in("job_post_id", jobIds);
      allStageCounts = data || [];
    }

    // Group stages by job_post_id in JS — O(n) single pass
    const screenedStages = new Set(["ai_screened", "ai_interviewed", "assessment", "human_interview", "offer", "hired"]);
    const interviewedStages = new Set(["ai_interviewed", "human_interview", "offer", "hired"]);

    const stagesByJob = allStageCounts.reduce(
      (acc, row) => {
        (acc[row.job_post_id] ??= []).push(row.pipeline_stage);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const jobPosts = (rows || []).map((row) => {
      const jp = transformJobPost(row);
      const stages = stagesByJob[row.id] ?? [];
      return {
        ...jp,
        screenedCount: stages.filter((s) => screenedStages.has(s)).length,
        interviewedCount: stages.filter((s) => interviewedStages.has(s)).length,
        hiredCount: stages.filter((s) => s === "hired").length,
      };
    });

    return NextResponse.json({ data: jobPosts });
  } catch (error) {
    console.error("Jobs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// transformJobPost + insertIntoJobsTable imported from @/lib/job-post-helpers
