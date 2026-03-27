import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformInterview } from "@/lib/interview-helpers";

// ─── GET: Single interview detail + report ───────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: row, error } = await supabase
      .from("ai_interviews")
      .select(`
        *,
        applicants (name, email, role_title, current_company),
        job_posts (title, company_id)
      `)
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    if (r.job_posts?.company_id !== company.id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: transformInterview(row, r.applicants || {}, r.job_posts?.title || ""),
    });
  } catch (error) {
    console.error("Interview detail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
