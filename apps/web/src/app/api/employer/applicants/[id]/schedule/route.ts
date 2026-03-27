import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { scheduleInterviewSchema } from "@/lib/validators";
import { transformHumanInterview } from "@/lib/scheduling-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id: applicantId } = await params;
    const body = await req.json();
    const parsed = scheduleInterviewSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();

    // Verify applicant belongs to company
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, name, email, job_post_id")
      .eq("id", applicantId)
      .single();

    if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });

    const { data: jobPost } = await supabase.from("job_posts").select("company_id, title").eq("id", applicant.job_post_id).single();
    if (!jobPost || jobPost.company_id !== company.id) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });

    // Count existing interviews for round number
    const { count } = await supabase
      .from("human_interviews")
      .select("id", { count: "exact", head: true })
      .eq("applicant_id", applicantId);

    const roundNumber = (count || 0) + 1;
    const meetingLink = parsed.data.meetingLink || `https://meet.google.com/fv-${applicantId.slice(0, 4)}-${Date.now().toString(36)}`;

    const { data: row, error } = await supabase
      .from("human_interviews")
      .insert({
        applicant_id: applicantId,
        job_post_id: parsed.data.jobPostId,
        interviewer_id: parsed.data.interviewerId,
        round_number: roundNumber,
        interview_type: parsed.data.interviewType,
        scheduled_at: parsed.data.scheduledAt,
        duration_minutes: parsed.data.durationMinutes,
        meeting_link: meetingLink,
        status: "scheduled",
      })
      .select("*")
      .single();

    if (error || !row) {
      console.error("Schedule error:", error);
      return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
    }

    // Get interviewer name
    const { data: interviewer } = await supabase.from("users").select("full_name").eq("id", parsed.data.interviewerId).single();

    console.log(`[Schedule] Interview scheduled for ${applicant.name} with ${interviewer?.full_name || "interviewer"} at ${parsed.data.scheduledAt}`);

    return NextResponse.json({
      data: transformHumanInterview(row, applicant, jobPost.title, interviewer?.full_name || ""),
      message: "Interview scheduled",
    }, { status: 201 });
  } catch (error) {
    console.error("Schedule POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
