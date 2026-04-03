import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    const { data: company, error } = await supabase
      .from("companies")
      .select("id, name, logo_url, website_url, industry, company_size, description, culture_keywords, locations")
      .eq("id", id)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get active job posts for this company
    const { data: jobs } = await supabase
      .from("job_posts")
      .select("id, title, location, work_mode, job_type, salary_min, salary_max, salary_currency, required_skills, nice_to_have_skills, description, application_deadline, openings_count, created_at")
      .eq("company_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);

    const formatted = {
      id: company.id,
      name: company.name,
      logoUrl: company.logo_url,
      websiteUrl: company.website_url,
      industry: company.industry,
      companySize: company.company_size,
      description: company.description,
      cultureKeywords: company.culture_keywords || [],
      locations: company.locations || [],
      activeJobs: (jobs || []).map((j) => ({
        id: j.id,
        title: j.title,
        location: j.location,
        workMode: j.work_mode,
        jobType: j.job_type,
        salaryMin: j.salary_min,
        salaryMax: j.salary_max,
        salaryCurrency: j.salary_currency,
        requiredSkills: j.required_skills || [],
        niceToHaveSkills: j.nice_to_have_skills || [],
        description: j.description,
        applicationDeadline: j.application_deadline,
        openingsCount: j.openings_count,
        postedAt: j.created_at,
      })),
    };

    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error("Company detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
