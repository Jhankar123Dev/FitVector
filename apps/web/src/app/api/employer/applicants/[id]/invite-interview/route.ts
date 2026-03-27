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

    // Log the "email" (no real email for now)
    console.log(
      `[AI Interview Invite] Sent to ${applicant.email} for "${jobPost.title}" — token: ${interview.id}`
    );

    return NextResponse.json(
      {
        data: transformInterview(
          interview,
          applicant,
          jobPost.title,
        ),
        token: interview.id,
        message: "Interview invite sent",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite interview POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
