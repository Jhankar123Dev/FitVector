import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const PYTHON_SERVICE_SECRET = process.env.PYTHON_SERVICE_SECRET || "";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const supabase = createAdminClient();

    // Fetch LaTeX source — only the owner can access their resume
    const { data: resume, error } = await supabase
      .from("tailored_resumes")
      .select("latex_source, version_name")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (error || !resume) {
      return new Response("Resume not found", { status: 404 });
    }

    if (!resume.latex_source) {
      return new Response(
        "PDF not available for this resume. Please use Tailor Resume to generate a version first.",
        { status: 422 },
      );
    }

    // Compile via Python service (Tectonic)
    const compileRes = await fetch(`${PYTHON_SERVICE_URL}/ai/compile-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": PYTHON_SERVICE_SECRET,
      },
      body: JSON.stringify({ latex_source: resume.latex_source }),
    });

    if (!compileRes.ok) {
      const err = await compileRes.text();
      console.error("PDF compile failed:", err);
      return new Response(`PDF compilation failed: ${err}`, { status: 502 });
    }

    const pdfBytes = await compileRes.arrayBuffer();
    const safeName = resume.version_name.replace(/[^a-z0-9_-]/gi, "_");

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}.pdf"`,
        // Cache for 1 hour — LaTeX rarely changes after generation
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Compile PDF route error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
