import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformInterview } from "@/lib/interview-helpers";

// ─── GET: Compare multiple interviews ────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids") || "";
    const ids = idsParam.split(",").filter(Boolean).slice(0, 3);

    if (ids.length === 0) {
      return NextResponse.json({ error: "No interview IDs provided" }, { status: 400 });
    }

    const { data: rows, error } = await supabase
      .from("ai_interviews")
      .select(`
        *,
        applicants (name, email, role_title, current_company),
        job_posts (title, company_id)
      `)
      .in("id", ids);

    if (error) {
      console.error("Compare fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
    }

    // Filter to company's interviews only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyRows = (rows || []).filter((r: any) => r.job_posts?.company_id === company.id);

    const interviews = companyRows.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      return transformInterview(row, r.applicants || {}, r.job_posts?.title || "");
    });

    return NextResponse.json({ data: interviews });
  } catch (error) {
    console.error("Compare GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
