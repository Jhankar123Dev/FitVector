import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformHumanInterview } from "@/lib/scheduling-helpers";
import { z } from "zod";

const scheduleInterviewBodySchema = z.object({
  applicantId: z.string().uuid(),
  interviewType: z.enum(["phone_screen", "technical", "behavioral", "culture_fit", "hiring_manager", "panel"]).default("technical"),
  scheduledAt: z.string().min(1, "Scheduled time is required"),
  durationMinutes: z.number().int().min(15).max(180).default(60),
  meetingLink: z.string().url().optional().nullable(),
});

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const supabase = createAdminClient();

    const { data: jobPosts } = await supabase.from("job_posts").select("id").eq("company_id", company.id);
    const jpIds = (jobPosts || []).map((jp) => jp.id);
    if (jpIds.length === 0) return NextResponse.json({ data: [] });

    const { data: rows, error } = await supabase
      .from("human_interviews")
      .select(`
        *,
        applicants (name, email),
        job_posts (title),
        users!human_interviews_interviewer_id_fkey (full_name)
      `)
      .in("job_post_id", jpIds)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Scheduling fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const interviews = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      return transformHumanInterview(row, r.applicants || {}, r.job_posts?.title || "", r.users?.full_name || "");
    });

    return NextResponse.json({ data: interviews });
  } catch (error) {
    console.error("Scheduling GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Schedule a human interview and advance pipeline stage ──────────────

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company, session } = result.data;
    const body = await req.json();
    const parsed = scheduleInterviewBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { applicantId, interviewType, scheduledAt, durationMinutes, meetingLink } = parsed.data;
    const supabase = createAdminClient();

    // Verify applicant belongs to this company
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, job_post_id, name, email")
      .eq("id", applicantId)
      .single();

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("id, company_id, title")
      .eq("id", applicant.job_post_id)
      .single();

    if (!jobPost || jobPost.company_id !== company.id) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Insert human_interviews record (interviewer = session user)
    const { data: interview, error: insertError } = await supabase
      .from("human_interviews")
      .insert({
        applicant_id: applicantId,
        job_post_id: applicant.job_post_id,
        interviewer_id: session.user.id,
        interview_type: interviewType,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        meeting_link: meetingLink ?? null,
        status: "scheduled",
      })
      .select("*")
      .single();

    if (insertError || !interview) {
      console.error("Schedule interview insert error:", insertError);
      return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 });
    }

    // Advance pipeline stage to human_interview
    await supabase
      .from("applicants")
      .update({ pipeline_stage: "human_interview" })
      .eq("id", applicantId);

    // Sync FV status → interviewed
    const now = new Date().toISOString();
    const { data: fvApp } = await supabase
      .from("fitvector_applications")
      .select("id")
      .eq("applicant_id", applicantId)
      .single();

    if (fvApp) {
      await supabase
        .from("fitvector_applications")
        .update({ status: "interviewed", status_updated_at: now })
        .eq("id", fvApp.id);
      await supabase
        .from("applications")
        .update({ status: "interview" })
        .eq("fitvector_app_id", fvApp.id);
    }

    return NextResponse.json(
      { data: interview, message: "Interview scheduled" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Scheduling POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
