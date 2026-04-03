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

    // Pagination
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50", 10));
    const offset = (page - 1) * limit;

    // Sort
    const sortColumn = sort === "score" ? "screening_score" : sort === "name" ? "name" : "created_at";

    // Get total count
    const { count: totalCount } = await supabase
      .from("applicants")
      .select("*", { count: "exact", head: true })
      .eq("job_post_id", jobPostId);

    query = query
      .order(sortColumn, { ascending: order === "asc", nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: rows, error } = await query;

    if (error) {
      console.error("Applicants fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
    }

    // ── Enrich with PDF URL from tailored_resumes via fitvector_applications ──
    const applicantIds = (rows || []).map((r) => r.id as string);
    let pdfByApplicantId: Record<string, string> = {};

    if (applicantIds.length > 0) {
      const { data: fvApps } = await supabase
        .from("fitvector_applications")
        .select("applicant_id, tailored_resume_id")
        .in("applicant_id", applicantIds)
        .not("tailored_resume_id", "is", null);

      const resumeIds = (fvApps || [])
        .map((a) => a.tailored_resume_id as string)
        .filter(Boolean);

      if (resumeIds.length > 0) {
        const { data: resumes } = await supabase
          .from("tailored_resumes")
          .select("id, pdf_url")
          .in("id", resumeIds)
          .not("pdf_url", "is", null);

        const pdfByResumeId: Record<string, string> = {};
        for (const r of resumes || []) {
          if (r.pdf_url) pdfByResumeId[r.id] = r.pdf_url;
        }

        for (const fv of fvApps || []) {
          if (fv.tailored_resume_id && pdfByResumeId[fv.tailored_resume_id]) {
            pdfByApplicantId[fv.applicant_id] = pdfByResumeId[fv.tailored_resume_id];
          }
        }
      }
    }

    const applicants = (rows || []).map((row) => ({
      ...transformApplicant(row),
      resumePdfUrl: pdfByApplicantId[row.id as string] ?? null,
    }));

    return NextResponse.json({
      data: applicants,
      total: totalCount ?? 0,
      page,
      limit,
      hasMore: offset + limit < (totalCount ?? 0),
    });
  } catch (error) {
    console.error("Applicants GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
