import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

// ─── GET: Full analytics data ────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30d";

    // Compute date filter
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[range] || 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get company job post IDs
    const { data: jobPosts } = await supabase
      .from("job_posts")
      .select("id")
      .eq("company_id", company.id);

    const jpIds = (jobPosts || []).map((jp) => jp.id);
    if (jpIds.length === 0) {
      return NextResponse.json({
        data: {
          totalApplicants: 0,
          interviewsConducted: 0,
          offersMade: 0,
          hires: 0,
          avgTimeToHire: null,
          costPerHire: null,
        },
      });
    }

    // Total applicants (within date range)
    const { count: totalApplicants } = await supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .in("job_post_id", jpIds)
      .gte("created_at", sinceDate);

    // AI interviews completed
    const { count: aiInterviews } = await supabase
      .from("ai_interviews")
      .select("id", { count: "exact", head: true })
      .in("job_post_id", jpIds)
      .eq("status", "completed")
      .gte("created_at", sinceDate);

    // Human interviews completed
    const { count: humanInterviews } = await supabase
      .from("human_interviews")
      .select("id", { count: "exact", head: true })
      .in("job_post_id", jpIds)
      .eq("status", "completed")
      .gte("created_at", sinceDate);

    // Offers made
    const { count: offersMade } = await supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .in("job_post_id", jpIds)
      .in("pipeline_stage", ["offer", "hired"]);

    // Hires
    const { count: hires } = await supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .in("job_post_id", jpIds)
      .eq("pipeline_stage", "hired");

    // Avg time to hire (days between created_at and now for hired applicants)
    const { data: hiredApplicants } = await supabase
      .from("applicants")
      .select("created_at, updated_at")
      .in("job_post_id", jpIds)
      .eq("pipeline_stage", "hired");

    let avgTimeToHire: number | null = null;
    if (hiredApplicants && hiredApplicants.length > 0) {
      const totalDays = hiredApplicants.reduce((sum, a) => {
        const start = new Date(a.created_at).getTime();
        const end = new Date(a.updated_at).getTime();
        return sum + (end - start) / (1000 * 60 * 60 * 24);
      }, 0);
      avgTimeToHire = Math.round(totalDays / hiredApplicants.length);
    }

    return NextResponse.json({
      data: {
        totalApplicants: totalApplicants || 0,
        interviewsConducted: (aiInterviews || 0) + (humanInterviews || 0),
        offersMade: offersMade || 0,
        hires: hires || 0,
        avgTimeToHire,
        costPerHire: null, // Future feature
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
