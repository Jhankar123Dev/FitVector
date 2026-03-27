import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformApplicant } from "@/lib/applicant-helpers";

// ─── GET: List all applicants across all company's job posts ─────────────────

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const supabase = createAdminClient();
    const url = new URL(req.url);

    // First get all company job post IDs
    const { data: jobPosts } = await supabase
      .from("job_posts")
      .select("id")
      .eq("company_id", company.id);

    const jobPostIds = (jobPosts || []).map((jp) => jp.id);

    if (jobPostIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Build query with filters
    const stage = url.searchParams.get("stage");
    const bucket = url.searchParams.get("bucket");
    const search = url.searchParams.get("search");

    let query = supabase
      .from("applicants")
      .select("*")
      .in("job_post_id", jobPostIds)
      .order("created_at", { ascending: false });

    if (stage && stage !== "all") {
      query = query.eq("pipeline_stage", stage);
    }
    if (bucket) {
      query = query.eq("bucket", bucket);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,role_title.ilike.%${search}%`);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("All applicants fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
    }

    const applicants = (rows || []).map(transformApplicant);
    return NextResponse.json({ data: applicants });
  } catch (error) {
    console.error("All applicants GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
