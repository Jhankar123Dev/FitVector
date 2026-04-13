import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET: Get interview info for candidate (public, no auth) ─────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: interview, error } = await supabase
      .from("ai_interviews")
      .select(`
        id, interview_type, duration_planned, status,
        invite_sent_at, invite_expires_at, started_at,
        applicants (name, email),
        job_posts (title, description, required_skills, interview_plan)
      `)
      .eq("id", token)
      .single();

    if (error || !interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Check if expired
    if (interview.invite_expires_at && new Date(interview.invite_expires_at) < new Date()) {
      if (interview.status === "invited") {
        // Mark as expired
        await supabase.from("ai_interviews").update({ status: "expired" }).eq("id", token);
        return NextResponse.json({ error: "Interview invite has expired" }, { status: 410 });
      }
    }

    if (interview.status === "cancelled") {
      return NextResponse.json({ error: "Interview has been cancelled" }, { status: 410 });
    }

    if (interview.status === "completed") {
      return NextResponse.json({ error: "Interview has already been completed" }, { status: 410 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = interview as any;

    return NextResponse.json({
      data: {
        id: interview.id,
        status: interview.status,
        interviewType: interview.interview_type,
        durationPlanned: interview.duration_planned,
        candidateName: r.applicants?.name || "Candidate",
        jobTitle: r.job_posts?.title || "",
      },
    });
  } catch (error) {
    console.error("Interview GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

