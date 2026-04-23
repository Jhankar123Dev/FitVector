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

    // Fetch human interviews with feedback and interviewer info
    const { data: interviews } = await supabase
      .from("human_interviews")
      .select("interviewer_id, status, scheduled_at, feedback_submitted_at, overall_score, users(full_name)")
      .in("job_post_id", jpIds)
      .eq("status", "completed");

    if (!interviews || interviews.length === 0) return NextResponse.json({ data: [] });

    const memberMap: Record<string, {
      name: string;
      count: number;
      totalFeedbackHours: number;
      feedbackCount: number;
      totalScore: number;
      scoredCount: number;
    }> = {};

    for (const iv of interviews) {
      const uid = iv.interviewer_id as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (iv.users as any)?.full_name || "Unknown";
      if (!memberMap[uid]) {
        memberMap[uid] = { name, count: 0, totalFeedbackHours: 0, feedbackCount: 0, totalScore: 0, scoredCount: 0 };
      }
      memberMap[uid].count++;
      if (iv.feedback_submitted_at && iv.scheduled_at) {
        const hours = Math.round(
          (new Date(iv.feedback_submitted_at).getTime() - new Date(iv.scheduled_at).getTime()) / (1000 * 60 * 60)
        );
        if (hours >= 0) {
          memberMap[uid].totalFeedbackHours += hours;
          memberMap[uid].feedbackCount++;
        }
      }
      if (iv.overall_score != null) {
        memberMap[uid].totalScore += iv.overall_score as number;
        memberMap[uid].scoredCount++;
      }
    }

    const data = Object.entries(memberMap).map(([memberId, m]) => ({
      memberId,
      name: m.name,
      interviewsDone: m.count,
      avgFeedbackTime: m.feedbackCount > 0 ? Math.round(m.totalFeedbackHours / m.feedbackCount) : null,
      avgScore: m.scoredCount > 0 ? Math.round(m.totalScore / m.scoredCount) : null,
    }));

    data.sort((a, b) => b.interviewsDone - a.interviewsDone);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Interviewers analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
