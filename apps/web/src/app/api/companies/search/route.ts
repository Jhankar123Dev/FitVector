import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(24, parseInt(searchParams.get("limit") || "12", 10));
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    // Get companies that have active job posts
    let query = supabase
      .from("companies")
      .select("id, name, logo_url, industry, company_size, description, locations", { count: "exact" });

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,industry.ilike.%${q}%`);
    }

    query = query
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: companies, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to search companies" }, { status: 500 });
    }

    // Get active job counts per company
    const companyIds = (companies || []).map((c) => c.id);
    let jobCounts: Record<string, number> = {};

    if (companyIds.length > 0) {
      const { data: counts } = await supabase
        .from("job_posts")
        .select("company_id")
        .in("company_id", companyIds)
        .eq("status", "active");

      for (const row of counts || []) {
        jobCounts[row.company_id] = (jobCounts[row.company_id] || 0) + 1;
      }
    }

    const formatted = (companies || []).map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logo_url,
      industry: c.industry,
      companySize: c.company_size,
      description: c.description,
      locations: c.locations || [],
      activeJobCount: jobCounts[c.id] || 0,
    }));

    return NextResponse.json({
      data: formatted,
      total: count ?? 0,
      page,
      limit,
      hasMore: offset + limit < (count ?? 0),
    });
  } catch (err) {
    console.error("Company search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
