import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { rejectApplicantSchema } from "@/lib/validators";
import { transformApplicant } from "@/lib/applicant-helpers";

// ─── PUT: Reject applicant with reason ───────────────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id } = await params;
    const body = await req.json();
    const parsed = rejectApplicantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify ownership
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, job_post_id")
      .eq("id", id)
      .single();

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("company_id")
      .eq("id", applicant.job_post_id)
      .single();

    if (!jobPost || jobPost.company_id !== company.id) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Update to rejected with reason
    const { data: updated, error: updateError } = await supabase
      .from("applicants")
      .update({
        pipeline_stage: "rejected",
        rejection_reason: parsed.data.reason,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Reject error:", updateError);
      return NextResponse.json({ error: "Failed to reject applicant" }, { status: 500 });
    }

    return NextResponse.json({
      data: transformApplicant(updated),
      message: "Applicant rejected",
    });
  } catch (error) {
    console.error("Reject PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
