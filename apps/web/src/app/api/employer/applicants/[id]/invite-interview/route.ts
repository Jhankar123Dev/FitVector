import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { inviteInterviewSchema } from "@/lib/validators";
import { transformInterview } from "@/lib/interview-helpers";

// ─── POST: Send AI interview invite ──────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id: applicantId } = await params;
    const body = await req.json();
    const parsed = inviteInterviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch applicant and verify company ownership
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, job_post_id, name, email, role_title, current_company")
      .eq("id", applicantId)
      .single();

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("id, company_id, title, interview_plan")
      .eq("id", applicant.job_post_id)
      .single();

    if (!jobPost || jobPost.company_id !== company.id) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Check if interview already exists
    const { data: existing } = await supabase
      .from("ai_interviews")
      .select("id, status")
      .eq("applicant_id", applicantId)
      .in("status", ["invited", "started"])
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An active interview already exists for this applicant" },
        { status: 409 }
      );
    }

    // Create the interview record
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: interview, error: insertError } = await supabase
      .from("ai_interviews")
      .insert({
        applicant_id: applicantId,
        job_post_id: applicant.job_post_id,
        interview_type: parsed.data.interviewType,
        duration_planned: parsed.data.durationPlanned,
        status: "invited",
        invite_sent_at: now.toISOString(),
        invite_expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (insertError || !interview) {
      console.error("Interview create error:", insertError);
      return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
    }

    // Build the interview link for the candidate
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const interviewLink = `${baseUrl}/interview/${interview.id}`;

    // Auto-transition applicant stage to ai_interview
    await supabase
      .from("applicants")
      .update({ pipeline_stage: "ai_interview" })
      .eq("id", applicantId);

    // Sync seeker tracker and FitVector application status
    const { data: fvApp } = await supabase
      .from("fitvector_applications")
      .select("id")
      .eq("applicant_id", applicantId)
      .single();

    if (fvApp) {
      await supabase
        .from("fitvector_applications")
        .update({ status: "interview_invited", status_updated_at: new Date().toISOString() })
        .eq("id", fvApp.id);
      await supabase
        .from("applications")
        .update({ status: "interview" })
        .eq("fitvector_app_id", fvApp.id);
    }

    // NOTE: interviewLink is derived from interview.id — no need to store separately.
    // The seeker can access it at /interview/{interview.id} using their auth context.

    // TODO: Send actual email when email service is configured (e.g. Resend)
    // await sendEmail({ to: applicant.email, subject: `Interview invitation for ${jobPost.title}`, body: `... ${interviewLink}` });
    console.log(
      `[AI Interview Invite] ${applicant.email} | "${jobPost.title}" | link: ${interviewLink}`
    );

    return NextResponse.json(
      {
        data: transformInterview(
          interview,
          applicant,
          jobPost.title,
        ),
        token: interview.id,
        interviewLink,
        message: "Interview invite sent",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite interview POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
