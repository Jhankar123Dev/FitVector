import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformApplicant } from "@/lib/applicant-helpers";

// ─── GET: List applicants for a job post ─────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id: jobPostId } = await params;
    const supabase = createAdminClient();

    // Verify job post belongs to company
    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("id")
      .eq("id", jobPostId)
      .eq("company_id", company.id)
      .single();

    if (!jobPost) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    // Build query with optional filters
    const url = new URL(req.url);
    const stage = url.searchParams.get("stage");
    const bucket = url.searchParams.get("bucket");
    const source = url.searchParams.get("source");
    const scoreMin = url.searchParams.get("scoreMin");
    const scoreMax = url.searchParams.get("scoreMax");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") || "created_at";
    const order = url.searchParams.get("order") || "desc";

    let query = supabase
      .from("applicants")
      .select("*")
      .eq("job_post_id", jobPostId);

    if (stage && stage !== "all") {
      query = query.eq("pipeline_stage", stage);
    }
    if (bucket) {
      query = query.eq("bucket", bucket);
    }
    if (source) {
      query = query.eq("source", source);
    }
    if (scoreMin) {
      query = query.gte("screening_score", parseInt(scoreMin, 10));
    }
    if (scoreMax) {
      query = query.lte("screening_score", parseInt(scoreMax, 10));
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,role_title.ilike.%${search}%`);
    }

    // Sort
    const sortColumn = sort === "score" ? "screening_score" : sort === "name" ? "name" : "created_at";
    query = query.order(sortColumn, { ascending: order === "asc", nullsFirst: false });

    const { data: rows, error } = await query;

    if (error) {
      console.error("Applicants fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
    }

    const applicants = (rows || []).map(transformApplicant);
    return NextResponse.json({ data: applicants });
  } catch (error) {
    console.error("Applicants GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
