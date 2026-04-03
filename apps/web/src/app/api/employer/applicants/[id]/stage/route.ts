import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { changeStageSchema } from "@/lib/validators";
import { transformApplicant } from "@/lib/applicant-helpers";

// ─── PUT: Move applicant to new pipeline stage ──────────────────────────────

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
    const parsed = changeStageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch and verify ownership
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, pipeline_stage, job_post_id")
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

    // Update stage (trigger auto-updates updated_at)
    const { data: updated, error: updateError } = await supabase
      .from("applicants")
      .update({ pipeline_stage: parsed.data.stage })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Stage update error:", updateError);
      return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
    }

    // ── Sync seeker tracker & FitVector application status ──────────
    const now = new Date().toISOString();

    // Map pipeline stage → FV app status
    const FV_STATUS_MAP: Record<string, string> = {
      ai_screened: "under_review",
      ai_interviewed: "under_review",
      assessment: "under_review",
      human_interview: "interview_invited",
      offer: "offered",
      hired: "offered",
    };
    // Map pipeline stage → tracker application_status enum
    const TRACKER_STATUS_MAP: Record<string, string> = {
      ai_screened: "screening",
      ai_interviewed: "interview",
      assessment: "interview",
      human_interview: "interview",
      offer: "offer",
      hired: "offer",
    };

    const fvStatus = FV_STATUS_MAP[parsed.data.stage];
    const trackerStatus = TRACKER_STATUS_MAP[parsed.data.stage];

    if (fvStatus || trackerStatus) {
      const { data: fvApp } = await supabase
        .from("fitvector_applications")
        .select("id")
        .eq("applicant_id", id)
        .single();

      if (fvApp) {
        if (fvStatus) {
          await supabase
            .from("fitvector_applications")
            .update({ status: fvStatus, status_updated_at: now })
            .eq("id", fvApp.id);
        }
        if (trackerStatus) {
          await supabase
            .from("applications")
            .update({ status: trackerStatus })
            .eq("fitvector_app_id", fvApp.id);
        }
      }
    }

    return NextResponse.json({
      data: transformApplicant(updated),
      message: `Moved to ${parsed.data.stage}`,
    });
  } catch (error) {
    console.error("Stage PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
