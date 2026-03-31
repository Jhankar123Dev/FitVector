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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("companies")
    .select("id, name, industry, company_size, plan_tier, created_at, website_url", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Admin companies fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }

  // Get job post counts per company
  const companyIds = (data || []).map((c) => c.id);
  const { data: jobCounts } = await supabase
    .from("job_posts")
    .select("company_id")
    .in("company_id", companyIds);

  const countByCompany = (jobCounts || []).reduce(
    (acc, row) => {
      acc[row.company_id] = (acc[row.company_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return NextResponse.json({
    data: (data || []).map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      companySize: c.company_size,
      planTier: c.plan_tier,
      websiteUrl: c.website_url,
      createdAt: c.created_at,
      jobPostCount: countByCompany[c.id] || 0,
    })),
    total: count ?? 0,
    page,
    limit,
  });
}
