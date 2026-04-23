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
      .select("id")
      .eq("company_id", company.id);

    const jpIds = (jobPosts || []).map((jp) => jp.id);
    if (jpIds.length === 0) return NextResponse.json({ data: [] });

    const { data: hired } = await supabase
      .from("applicants")
      .select("created_at, updated_at")
      .in("job_post_id", jpIds)
      .eq("pipeline_stage", "hired")
      .order("updated_at", { ascending: true });

    if (!hired || hired.length === 0) return NextResponse.json({ data: [] });

    // Group into weekly buckets by hire date
    const weekMap: Record<string, { totalDays: number; count: number }> = {};
    for (const a of hired) {
      const hireDate = new Date(a.updated_at);
      // ISO week label: "Week of MMM D"
      const monday = new Date(hireDate);
      monday.setDate(hireDate.getDate() - ((hireDate.getDay() + 6) % 7));
      const label = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const days = Math.max(1, Math.round(
        (new Date(a.updated_at).getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ));
      if (!weekMap[label]) weekMap[label] = { totalDays: 0, count: 0 };
      weekMap[label].totalDays += days;
      weekMap[label].count++;
    }

    const data = Object.entries(weekMap).map(([week, v]) => ({
      week,
      days: Math.round(v.totalDays / v.count),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Trend analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
