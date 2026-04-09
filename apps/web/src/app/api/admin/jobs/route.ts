import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function jobFingerprint(title: string, company: string, location: string): string {
  const raw = `${title}|${company}|${location}`.toLowerCase().trim();
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

const jobSchema = z.object({
  title: z.string().min(1),
  companyName: z.string().min(1),
  location: z.string().optional().default(""),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional().nullable(),
  jobType: z.enum(["fulltime", "parttime", "contract", "internship"]).optional().nullable(),
  description: z.string().optional().default(""),
  skillsRequired: z.array(z.string()).optional().default([]),
  skillsNiceToHave: z.array(z.string()).optional().default([]),
  salaryMin: z.number().nullish(),
  salaryMax: z.number().nullish(),
  salaryCurrency: z.string().optional().default("INR"),
  url: z.string().url().optional().default("https://fitvector.pro"),
  source: z.enum(["direct", "linkedin", "naukri", "indeed", "glassdoor", "google", "ziprecruiter", "fitvector", "seed"]).optional().default("direct"),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const result = await getAdminSession();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const source = searchParams.get("source") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("jobs")
    .select("id, title, company_name, location, source, is_active, posted_at, work_mode, job_type, skills_required, posted_by_employer_id", { count: "exact" })
    .order("posted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,company_name.ilike.%${search}%`);
  }
  if (source) {
    query = query.eq("source", source);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Admin jobs fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }

  return NextResponse.json({
    data: (data || []).map((j) => ({
      id: j.id,
      title: j.title,
      companyName: j.company_name,
      location: j.location,
      source: j.source,
      isActive: j.is_active,
      postedAt: j.posted_at,
      workMode: j.work_mode,
      jobType: j.job_type,
      skillsRequired: j.skills_required || [],
      isDirect: j.posted_by_employer_id !== null,
    })),
    total: count ?? 0,
    page,
    limit,
  });
}

// ─── POST: Create single job or bulk import ───────────────────────────────────
export async function POST(req: Request) {
  const result = await getAdminSession();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = createAdminClient();
  const body = await req.json();

  // Bulk import: { jobs: [...] }
  const isBulk = Array.isArray(body.jobs);
  const rawJobs: unknown[] = isBulk ? body.jobs : [body];

  const rows: Record<string, unknown>[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < rawJobs.length; i++) {
    const parsed = jobSchema.safeParse(rawJobs[i]);
    if (!parsed.success) {
      errors.push({ index: i, error: parsed.error.flatten().fieldErrors as unknown as string });
      continue;
    }
    const d = parsed.data;
    rows.push({
      title: d.title,
      company_name: d.companyName,
      location: d.location,
      work_mode: d.workMode ?? null,
      job_type: d.jobType ?? null,
      description: d.description,
      skills_required: d.skillsRequired,
      skills_nice_to_have: d.skillsNiceToHave,
      salary_min: d.salaryMin ?? null,
      salary_max: d.salaryMax ?? null,
      salary_currency: d.salaryCurrency,
      url: d.url,
      source: d.source,
      is_active: d.isActive,
      posted_at: new Date().toISOString(),
      fingerprint: jobFingerprint(d.title, d.companyName, d.location),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid jobs to insert", details: errors },
      { status: 400 },
    );
  }

  // Insert in batches of 100
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from("jobs").insert(batch);
    if (error) {
      console.error("Admin job insert error:", error);
      return NextResponse.json(
        { error: "Insert failed", insertedSoFar: inserted },
        { status: 500 },
      );
    }
    inserted += batch.length;
  }

  return NextResponse.json({
    success: true,
    inserted,
    skipped: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// ─── PATCH: Toggle active status ──────────────────────────────────────────────
export async function PATCH(req: Request) {
  const result = await getAdminSession();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = createAdminClient();
  const body = await req.json();
  const { jobId, isActive } = body;

  if (!jobId || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "jobId and isActive are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("jobs")
    .update({ is_active: isActive })
    .eq("id", jobId);

  if (error) {
    console.error("Admin job update error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
