import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("generated_outreach")
      .select("id, outreach_type, subject, body, tone, recruiter_name, job_title, company_name, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

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

    return Response.json({ data: formatted });
  } catch (error) {
    console.error("Outreach list error:", error);
    return Response.json({ error: "Failed to load outreach" }, { status: 500 });
  }
}
