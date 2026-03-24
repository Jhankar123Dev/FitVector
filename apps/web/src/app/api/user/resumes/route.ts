import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: resumes, error } = await supabase
      .from("tailored_resumes")
      .select("id, version_name, template_id, job_title, company_name, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch resumes:", error);
      return Response.json({ error: "Failed to load resumes" }, { status: 500 });
    }

    const formatted = (resumes || []).map((r) => ({
      id: r.id,
      versionName: r.version_name,
      templateId: r.template_id,
      jobTitle: r.job_title,
      companyName: r.company_name,
      createdAt: r.created_at,
    }));

    return Response.json({ data: formatted });
  } catch (error) {
    console.error("Resumes list error:", error);
    return Response.json({ error: "Failed to load resumes" }, { status: 500 });
  }
}
