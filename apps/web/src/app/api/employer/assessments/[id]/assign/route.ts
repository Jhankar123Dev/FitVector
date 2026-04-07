import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { assignAssessmentSchema } from "@/lib/validators";

// ─── POST: Assign assessment to applicant(s) ─────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id: assessmentId } = await params;
    const body = await req.json();
    const parsed = assignAssessmentSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();

    // Verify assessment belongs to company
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, company_id, name")
      .eq("id", assessmentId)
      .eq("company_id", company.id)
      .single();

    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    // Create submissions for each applicant
    const now = new Date().toISOString();
    const submissions = parsed.data.applicantIds.map((applicantId) => ({
      assessment_id: assessmentId,
      applicant_id: applicantId,
      job_post_id: parsed.data.jobPostId,
      status: "invited",
      invited_at: now,
    }));

    const { data: created, error } = await supabase
      .from("assessment_submissions")
      .insert(submissions)
      .select("id, applicant_id");

    if (error) {
      console.error("Assessment assign error:", error);
      return NextResponse.json({ error: "Failed to assign assessment" }, { status: 500 });
    }

    // Increment times_used
    try {
      const { data: current } = await supabase
        .from("assessments")
        .select("times_used")
        .eq("id", assessmentId)
        .single();
      await supabase
        .from("assessments")
        .update({ times_used: ((current?.times_used as number) || 0) + parsed.data.applicantIds.length })
        .eq("id", assessmentId);
    } catch {
      // Non-critical, continue
    }

    // Auto-advance applicants to assessment_pending stage
    const applicantIds = parsed.data.applicantIds;
    if (applicantIds.length > 0) {
      await supabase
        .from("applicants")
        .update({ pipeline_stage: "assessment_pending" })
        .in("id", applicantIds);

      // Sync FV status for each applicant
      for (const applicantId of applicantIds) {
        const { data: fvApp } = await supabase
          .from("fitvector_applications")
          .select("id")
          .eq("applicant_id", applicantId)
          .single();

        if (fvApp) {
          const now = new Date().toISOString();
          await supabase
            .from("fitvector_applications")
            .update({ status: "under_review", status_updated_at: now })
            .eq("id", fvApp.id);
        }
      }
    }

    // Log invites
    for (const sub of created || []) {
      console.log(`[Assessment Invite] Assigned ${assessment.name} to applicant ${sub.applicant_id} — token: ${sub.id}`);
    }

    return NextResponse.json({
      data: { assigned: (created || []).length, tokens: (created || []).map((s) => s.id) },
      message: `Assessment assigned to ${(created || []).length} applicant(s)`,
    }, { status: 201 });
  } catch (error) {
    console.error("Assessment assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
