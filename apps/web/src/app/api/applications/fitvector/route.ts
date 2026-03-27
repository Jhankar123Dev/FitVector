import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET: List my FitVector applications (seeker side) ───────────────────────

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from("fitvector_applications")
      .select(`
        id, applicant_user_id, job_post_id, applicant_id,
        tailored_resume_id, match_score, screening_responses, interest_note,
        resume_name, is_boosted, boost_tier, status, status_timeline,
        status_updated_at, created_at, updated_at,
        job_posts (title, company_id, location, companies (name, logo_url))
      `)
      .eq("applicant_user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("FV applications fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }

    const applications = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      const jobPost = r.job_posts;
      const company = jobPost?.companies;

      return {
        id: row.id,
        jobId: row.job_post_id,
        employerJobPostId: row.job_post_id,
        jobTitle: jobPost?.title || "",
        companyName: company?.name || "",
        companyLogoUrl: company?.logo_url || null,
        location: jobPost?.location || "",
        resumeId: row.tailored_resume_id,
        resumeName: row.resume_name || "Resume",
        screeningAnswers: row.screening_responses || [],
        coverNote: row.interest_note || "",
        matchScore: row.match_score,
        status: `fv_${row.status}`, // Add fv_ prefix for frontend
        statusTimeline: row.status_timeline || [],
        isBoosted: row.is_boosted || false,
        boostTier: row.boost_tier || null,
        appliedAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ data: applications });
  } catch (error) {
    console.error("FV applications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
