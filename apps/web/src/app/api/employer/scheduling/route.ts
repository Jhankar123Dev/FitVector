import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformHumanInterview } from "@/lib/scheduling-helpers";
import { getGoogleAccessToken, createCalendarEvent } from "@/lib/google-calendar";
import { z } from "zod";

const scheduleInterviewBodySchema = z.object({
  applicantId: z.string().uuid(),
  // One or more interviewers; the first in the array is the lead
  interviewerIds: z.array(z.string().uuid()).min(1, "At least one interviewer is required"),
  interviewType: z
    .enum(["phone_screen", "technical", "behavioral", "culture_fit", "hiring_manager", "panel"])
    .default("technical"),
  scheduledAt: z.string().min(1, "Scheduled time is required"),
  durationMinutes: z.number().int().min(15).max(180).default(60),
  meetingLink: z.string().url().optional().nullable(),
  // When true, auto-create a Google Meet link via Calendar API
  addMeetLink: z.boolean().optional().default(false),
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

    const interviewIds = (rows || []).map((r) => r.id);

    // Fetch all participants for these interviews in one query
    let participantMap: Record<string, Array<{ userId: string; name: string }>> = {};
    if (interviewIds.length > 0) {
      const { data: participants } = await supabase
        .from("interview_participants")
        .select(`
          human_interview_id,
          user_id,
          role,
          users!interview_participants_user_id_fkey (full_name)
        `)
        .in("human_interview_id", interviewIds)
        .order("role"); // lead first

      for (const p of participants || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = p as any;
        const iid = r.human_interview_id as string;
        if (!participantMap[iid]) participantMap[iid] = [];
        participantMap[iid].push({
          userId: r.user_id as string,
          name: r.users?.full_name || "Interviewer",
        });
      }
    }

    const interviews = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      const participants = participantMap[row.id as string];
      return transformHumanInterview(
        row,
        r.applicants || {},
        r.job_posts?.title || "",
        participants,
      );
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

    const { company } = result.data;
    const body = await req.json();
    const parsed = scheduleInterviewBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      applicantId,
      interviewerIds,
      interviewType,
      scheduledAt,
      durationMinutes,
      meetingLink,
      addMeetLink,
    } = parsed.data;

    const leadInterviewerId = interviewerIds[0];
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

    // Determine round number (count existing interviews for this applicant + 1)
    const { count: existingCount } = await supabase
      .from("human_interviews")
      .select("id", { count: "exact", head: true })
      .eq("applicant_id", applicantId);

    const roundNumber = (existingCount ?? 0) + 1;

    // Insert human_interviews record (lead interviewer on the row for FK simplicity)
    const { data: interview, error: insertError } = await supabase
      .from("human_interviews")
      .insert({
        applicant_id: applicantId,
        job_post_id: applicant.job_post_id,
        interviewer_id: leadInterviewerId,
        round_number: roundNumber,
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

    // Insert interview_participants for every interviewer
    const participantRows = interviewerIds.map((uid, idx) => ({
      human_interview_id: interview.id,
      user_id: uid,
      role: idx === 0 ? "lead" : "interviewer",
    }));

    const { error: participantsError } = await supabase
      .from("interview_participants")
      .insert(participantRows);

    if (participantsError) {
      console.error("[scheduling] Failed to insert interview_participants:", participantsError);
      // Non-fatal — interview row exists; log and continue
    }

    // ── Attempt Google Calendar event creation (best-effort, non-blocking) ──
    let calendarEventCreated = false;
    let finalMeetingLink = meetingLink ?? null;

    try {
      const accessToken = await getGoogleAccessToken(leadInterviewerId);

      if (accessToken) {
        // Fetch emails for all interviewers + candidate
        const { data: interviewerUsers } = await supabase
          .from("users")
          .select("id, email")
          .in("id", interviewerIds);

        const attendeeEmails: string[] = [
          ...(interviewerUsers || []).map((u) => u.email as string).filter(Boolean),
          applicant.email,
        ];

        const endDateTime = new Date(
          new Date(scheduledAt).getTime() + durationMinutes * 60_000,
        ).toISOString();

        const calResult = await createCalendarEvent(accessToken, {
          summary: `Interview: ${applicant.name} — ${jobPost.title}`,
          description: `Round ${roundNumber} ${interviewType.replace(/_/g, " ")} interview`,
          startDateTime: scheduledAt,
          endDateTime,
          attendeeEmails,
          addMeetLink: addMeetLink ?? false,
        });

        // Update the interview record with the calendar event ID (and Meet link if generated)
        const updatePayload: Record<string, string> = {
          calendar_event_id: calResult.eventId,
        };
        if (calResult.meetLink) {
          updatePayload.meeting_link = calResult.meetLink;
          finalMeetingLink = calResult.meetLink;
        }

        await supabase
          .from("human_interviews")
          .update(updatePayload)
          .eq("id", interview.id);

        calendarEventCreated = true;
      }
    } catch (calErr) {
      // Calendar failure must NOT block the interview from being saved
      console.error("[scheduling] Google Calendar event creation failed (non-fatal):", calErr);
    }

    // Advance pipeline stage to human_interview
    await supabase
      .from("applicants")
      .update({ pipeline_stage: "human_interview" })
      .eq("id", applicantId);

    // Sync FitVector status → interviewed
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
      {
        data: { ...interview, meeting_link: finalMeetingLink },
        calendarEventCreated,
        message: "Interview scheduled",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Scheduling POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
