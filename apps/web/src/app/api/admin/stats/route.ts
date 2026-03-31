import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await getAdminSession();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: directJobs },
    { count: totalCompanies },
    { count: totalApplications },
    { count: activeJobs },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("source", "direct"),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  // User breakdown by role
  const { data: roleCounts } = await supabase
    .from("users")
    .select("role");

  const roleBreakdown = (roleCounts || []).reduce(
    (acc, row) => {
      const r = (row.role as string) || "seeker";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Signups over last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newUsersWeek } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  return NextResponse.json({
    data: {
      totalUsers: totalUsers ?? 0,
      totalJobs: totalJobs ?? 0,
      directJobs: directJobs ?? 0,
      scrapedJobs: (totalJobs ?? 0) - (directJobs ?? 0),
      activeJobs: activeJobs ?? 0,
      totalCompanies: totalCompanies ?? 0,
      totalApplications: totalApplications ?? 0,
      newUsersWeek: newUsersWeek ?? 0,
      roleBreakdown,
    },
  });
}
