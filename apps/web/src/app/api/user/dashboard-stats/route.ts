import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const userId = session.user.id;

    // Run all counts in parallel
    const [applicationsRes, matchesRes, resumesRes, outreachRes] = await Promise.all([
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("status", "eq", "withdrawn"),
      supabase
        .from("job_matches")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_dismissed", false),
      supabase
        .from("tailored_resumes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("generated_outreach")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    return NextResponse.json({
      data: {
        activeApplications: applicationsRes.count ?? 0,
        jobMatches: matchesRes.count ?? 0,
        resumesCreated: resumesRes.count ?? 0,
        messagesSent: outreachRes.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
