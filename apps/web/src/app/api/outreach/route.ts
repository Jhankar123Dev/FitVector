import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const supabase = createAdminClient();

    // Count total first
    const { count } = await supabase
      .from("generated_outreach")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    const { data, error } = await supabase
      .from("generated_outreach")
      .select("id, outreach_type, subject, body, tone, recruiter_name, job_title, company_name, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return Response.json({ error: "Failed to load outreach" }, { status: 500 });
    }

    const formatted = (data || []).map((o) => ({
      id: o.id,
      outreachType: o.outreach_type,
      subject: o.subject,
      body: o.body,
      tone: o.tone,
      recruiterName: o.recruiter_name,
      jobTitle: o.job_title,
      companyName: o.company_name,
      createdAt: o.created_at,
    }));

    const total = count ?? 0;

    return Response.json({
      data: formatted,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Outreach list error:", error);
    return Response.json({ error: "Failed to load outreach" }, { status: 500 });
  }
}
