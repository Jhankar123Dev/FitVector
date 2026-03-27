import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

const STAGE_ORDER = [
  "applied", "ai_screened", "ai_interviewed", "assessment",
  "human_interview", "offer", "hired",
];

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const supabase = createAdminClient();

    const { data: jobPosts } = await supabase.from("job_posts").select("id").eq("company_id", company.id);
    const jpIds = (jobPosts || []).map((jp) => jp.id);

    if (jpIds.length === 0) {
      return NextResponse.json({ data: STAGE_ORDER.map((s) => ({ stage: s, count: 0, conversionRate: null })) });
    }

    // Count applicants at each stage (including those who passed through)
    const { data: applicants } = await supabase
      .from("applicants")
      .select("pipeline_stage")
      .in("job_post_id", jpIds);

    const stageCounts: Record<string, number> = {};
    for (const stage of STAGE_ORDER) {
      stageCounts[stage] = 0;
    }
    stageCounts["rejected"] = 0;

    for (const a of applicants || []) {
      const stage = a.pipeline_stage as string;
      // Count at current stage AND all previous stages (cumulative funnel)
      const idx = STAGE_ORDER.indexOf(stage);
      if (idx >= 0) {
        for (let i = 0; i <= idx; i++) {
          stageCounts[STAGE_ORDER[i]]++;
        }
      } else if (stage === "rejected") {
        stageCounts["rejected"]++;
        // Rejected candidates still count in "applied"
        stageCounts["applied"]++;
      }
    }

    // Build funnel with conversion rates
    const funnel = STAGE_ORDER.map((stage, i) => ({
      stage: stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count: stageCounts[stage],
      conversionRate: i === 0 ? null : stageCounts[STAGE_ORDER[i - 1]] > 0
        ? Math.round((stageCounts[stage] / stageCounts[STAGE_ORDER[i - 1]]) * 100)
        : null,
    }));

    return NextResponse.json({ data: funnel });
  } catch (error) {
    console.error("Funnel GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
