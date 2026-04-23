import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const supabase = createAdminClient();

    const { data: jobPosts } = await supabase
      .from("job_posts")
      .select("id, title")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!jobPosts || jobPosts.length === 0) return NextResponse.json({ data: [] });

    const jpIds = jobPosts.map((jp) => jp.id);

    const { data: applicants } = await supabase
      .from("applicants")
      .select("job_post_id, pipeline_stage")
      .in("job_post_id", jpIds);

    const SCREENED_STAGES = ["ai_screened", "ai_interviewed", "assessment", "human_interview", "offer", "hired"];
    const INTERVIEWED_STAGES = ["human_interview", "offer", "hired"];

    const jobMap: Record<string, { total: number; screened: number; interviewed: number; hired: number }> = {};
    for (const jp of jobPosts) {
      jobMap[jp.id] = { total: 0, screened: 0, interviewed: 0, hired: 0 };
    }
    for (const a of applicants || []) {
      const jid = a.job_post_id as string;
      const stage = a.pipeline_stage as string;
      if (!jobMap[jid]) continue;
      jobMap[jid].total++;
      if (SCREENED_STAGES.includes(stage)) jobMap[jid].screened++;
      if (INTERVIEWED_STAGES.includes(stage)) jobMap[jid].interviewed++;
      if (stage === "hired") jobMap[jid].hired++;
    }

    const data = jobPosts.map((jp) => {
      const m = jobMap[jp.id];
      return {
        jobId: jp.id,
        title: jp.title,
        applicants: m.total,
        screenRate: m.total > 0 ? Math.round((m.screened / m.total) * 100) : 0,
        interviewRate: m.total > 0 ? Math.round((m.interviewed / m.total) * 100) : 0,
        hired: m.hired,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Jobs analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
