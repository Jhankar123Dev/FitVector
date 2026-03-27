import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

const SOURCE_LABELS: Record<string, string> = {
  fitvector_organic: "FitVector",
  external_link: "External",
  referral: "Referral",
  imported: "Imported",
  boosted: "Boosted",
};

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const supabase = createAdminClient();

    const { data: jobPosts } = await supabase.from("job_posts").select("id").eq("company_id", company.id);
    const jpIds = (jobPosts || []).map((jp) => jp.id);

    if (jpIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get all applicants with source and score
    const { data: applicants } = await supabase
      .from("applicants")
      .select("source, screening_score")
      .in("job_post_id", jpIds);

    // Group by source
    const sourceMap: Record<string, { count: number; totalScore: number; scoredCount: number }> = {};
    for (const a of applicants || []) {
      const src = a.source as string;
      if (!sourceMap[src]) {
        sourceMap[src] = { count: 0, totalScore: 0, scoredCount: 0 };
      }
      sourceMap[src].count++;
      if (a.screening_score != null) {
        sourceMap[src].totalScore += a.screening_score as number;
        sourceMap[src].scoredCount++;
      }
    }

    const sources = Object.entries(sourceMap).map(([source, data]) => ({
      source: SOURCE_LABELS[source] || source,
      sourceKey: source,
      count: data.count,
      avgScore: data.scoredCount > 0 ? Math.round(data.totalScore / data.scoredCount) : 0,
    }));

    // Sort by count descending
    sources.sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: sources });
  } catch (error) {
    console.error("Sources GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
