import { createAdminClient } from "@/lib/supabase/admin";

// ─── Transform DB row → camelCase JobPost ────────────────────────────────────

export function transformJobPost(row: Record<string, unknown>) {
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
    pipelineStages: (row.pipeline_stages as string[]) || [
      "applied", "ai_screened", "assessment_pending", "assessment_completed",
      "ai_interview_pending", "ai_interviewed", "human_interview", "offer", "hired",
    ],
    viewsCount: row.views_count || 0,
    applicationsCount: row.applications_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Insert into scraped jobs table on publish ───────────────────────────────

export async function insertIntoJobsTable(
  supabase: ReturnType<typeof createAdminClient>,
  jobPost: Record<string, unknown>,
  company: { id: string; name: string; logoUrl: string | null; websiteUrl: string | null }
) {
  try {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("job_post_id", jobPost.id)
      .single();

    if (existing) {
      await supabase.from("jobs").update({ is_active: true }).eq("id", existing.id);
      return;
    }

    await supabase.from("jobs").insert({
      source: "fitvector",
      sources: ["fitvector"],
      fingerprint: `fitvector-${jobPost.id}`,
      url: `https://fitvector.com/jobs/${jobPost.id}`,
      title: jobPost.title as string,
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
    console.error("Failed to insert into jobs table:", err);
  }
}
