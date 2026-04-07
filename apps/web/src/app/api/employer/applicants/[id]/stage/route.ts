import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { changeStageSchema } from "@/lib/validators";
import { transformApplicant } from "@/lib/applicant-helpers";

// Stages that trigger an automatic action when an employer moves a candidate there
const AUTO_ACTIONS: Record<string, "invite_ai_interview" | "notify_human_interview"> = {
  ai_interview_pending: "invite_ai_interview",
  human_interview:      "notify_human_interview",
};

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

    // Map pipeline stage → FV app status (seeker-visible status)
    // Pipeline order: applied → ai_screened → assessment_pending → assessment_completed → ai_interview_pending → ai_interviewed → human_interview → offer → hired
    const FV_STATUS_MAP: Record<string, string> = {
      ai_screened:          "under_review",   // being reviewed/screened
      assessment_pending:   "under_review",   // test assigned, not yet completed
      assessment_completed: "under_review",   // test completed, awaiting next step
      ai_interview_pending: "under_review",   // interview invited, not yet taken
      ai_interviewed:       "interviewed",    // AI interview done
      human_interview:      "interviewed",    // human interview (same seeker bucket)
      offer:                "offered",        // offer extended
      hired:                "offered",        // hired (stays as offered on seeker side)
      rejected:             "rejected",
    };
    // Map pipeline stage → tracker application_status enum
    const TRACKER_STATUS_MAP: Record<string, string> = {
      ai_screened:          "screening",
      assessment_pending:   "screening",
      assessment_completed: "screening",
      ai_interview_pending: "interview",
      ai_interviewed:       "interview",
      human_interview:      "interview",
      offer:                "offer",
      hired:                "offer",
      rejected:             "rejected",
    };

    // For custom stages (not in the known maps), fall back to under_review / screening
    // so seekers always see a meaningful status update when the employer advances them.
    const fvStatus = FV_STATUS_MAP[parsed.data.stage] ?? "under_review";
    const trackerStatus = TRACKER_STATUS_MAP[parsed.data.stage] ?? "screening";

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

    // ── Auto-actions on specific stage transitions ──────────────────
    const autoAction = AUTO_ACTIONS[parsed.data.stage];
    let autoSent = false;

    if (autoAction === "invite_ai_interview") {
      // Only send if no active invite already exists
      const { data: existing } = await supabase
        .from("ai_interviews")
        .select("id")
        .eq("applicant_id", id)
        .in("status", ["invited", "started"])
        .single();

      if (!existing) {
        const { data: applicantInfo } = await supabase
          .from("applicants")
          .select("id, job_post_id, email, name")
          .eq("id", id)
          .single();

        if (applicantInfo) {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data: newInterview } = await supabase
            .from("ai_interviews")
            .insert({
              applicant_id: id,
              job_post_id: applicantInfo.job_post_id,
              interview_type: "technical",
              duration_planned: 30,
              status: "invited",
              invite_sent_at: new Date().toISOString(),
              invite_expires_at: expiresAt,
            })
            .select("id")
            .single();

          if (newInterview) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            console.log(
              `[Auto AI Interview Invite] ${applicantInfo.email} | stage: ${parsed.data.stage} | link: ${baseUrl}/interview/${newInterview.id}`
            );
            autoSent = true;
          }
        }
      }
    }

    if (autoAction === "notify_human_interview") {
      const { data: applicantInfo } = await supabase
        .from("applicants")
        .select("id, email, name")
        .eq("id", id)
        .single();

      if (applicantInfo) {
        // TODO: Send actual email when email service is configured (e.g. Resend)
        console.log(
          `[Auto Human Interview Notify] ${applicantInfo.email} — moved to human_interview stage`
        );
        autoSent = true;
      }
    }

    return NextResponse.json({
      data: { ...transformApplicant(updated), autoSent },
      message: `Moved to ${parsed.data.stage}${autoSent ? " — invite sent automatically" : ""}`,
    });
  } catch (error) {
    console.error("Stage PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
