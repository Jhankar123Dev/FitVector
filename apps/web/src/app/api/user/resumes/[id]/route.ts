import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const supabase = createAdminClient();

    const { data: resume, error } = await supabase
      .from("tailored_resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (error || !resume) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    return Response.json({
      data: {
        id: resume.id,
        versionName: resume.version_name,
        templateId: resume.template_id,
        latexSource: resume.latex_source,
        pdfUrl: resume.pdf_url,
        jobTitle: resume.job_title,
        companyName: resume.company_name,
        createdAt: resume.created_at,
      },
    });
  } catch (error) {
    console.error("Resume detail error:", error);
    return Response.json({ error: "Failed to load resume" }, { status: 500 });
  }
}
