import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const tags = url.searchParams.get("tags"); // comma-separated
    const scoreMin = url.searchParams.get("scoreMin");

    // Get company job post IDs
    const { data: jobPosts } = await supabase
      .from("job_posts")
      .select("id, title")
      .eq("company_id", company.id);

    const jpIds = (jobPosts || []).map((jp) => jp.id);
    const jpTitleMap = Object.fromEntries((jobPosts || []).map((jp) => [jp.id, jp.title]));

    if (jpIds.length === 0) return NextResponse.json({ data: [] });

    let query = supabase
      .from("applicants")
      .select("*")
      .in("job_post_id", jpIds)
      .eq("is_talent_pool", true)
      .order("screening_score", { ascending: false, nullsFirst: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,role_title.ilike.%${search}%`);
    }
    if (scoreMin) {
      query = query.gte("screening_score", parseInt(scoreMin, 10));
    }
    if (tags) {
      const tagList = tags.split(",").filter(Boolean);
      query = query.overlaps("talent_pool_tags", tagList);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Talent pool fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    // Map source values for frontend compat
    const sourceMap: Record<string, string> = {
      fitvector_organic: "fitvector",
      external_link: "external",
      referral: "referral",
      imported: "imported",
      boosted: "boosted",
    };

    const candidates = (rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      skills: (row.resume_parsed_json as Record<string, unknown>)?.skills || [],
      lastAppliedRole: row.role_title || "",
      lastAppliedJobId: row.job_post_id,
      lastAppliedJobTitle: jpTitleMap[row.job_post_id] || "",
      score: row.screening_score || 0,
      dateAdded: row.created_at,
      tags: row.talent_pool_tags || [],
      source: sourceMap[row.source] || row.source,
      notes: row.interest_note || null,
    }));

    return NextResponse.json({ data: candidates });
  } catch (error) {
    console.error("Talent pool GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
