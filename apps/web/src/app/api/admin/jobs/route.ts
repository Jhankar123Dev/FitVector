import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
