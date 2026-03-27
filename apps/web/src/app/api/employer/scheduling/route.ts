import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformHumanInterview } from "@/lib/scheduling-helpers";

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const supabase = createAdminClient();

    const { data: jobPosts } = await supabase.from("job_posts").select("id").eq("company_id", company.id);
    const jpIds = (jobPosts || []).map((jp) => jp.id);
    if (jpIds.length === 0) return NextResponse.json({ data: [] });

    const { data: rows, error } = await supabase
      .from("human_interviews")
      .select(`
        *,
        applicants (name, email),
        job_posts (title),
        users!human_interviews_interviewer_id_fkey (full_name)
      `)
      .in("job_post_id", jpIds)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Scheduling fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const interviews = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      return transformHumanInterview(row, r.applicants || {}, r.job_posts?.title || "", r.users?.full_name || "");
    });

    return NextResponse.json({ data: interviews });
  } catch (error) {
    console.error("Scheduling GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
