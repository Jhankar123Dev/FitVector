import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformApplicant } from "@/lib/applicant-helpers";

// ─── GET: Single applicant detail ────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch applicant and verify company ownership via job_post
    const { data: row, error } = await supabase
      .from("applicants")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Verify the job post belongs to this company
    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("id, title, company_id")
      .eq("id", row.job_post_id)
      .single();

    if (!jobPost || jobPost.company_id !== company.id) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const applicant = transformApplicant(row);

    // Fetch all human interview rounds for this applicant
    const { data: humanInterviewRows } = await supabase
      .from("human_interviews")
      .select("id, round_number, interview_type, scheduled_at, status, feedback, rating, notes, calendar_event_id, meeting_link")
      .eq("applicant_id", id)
      .order("round_number", { ascending: true });

    // Fetch participants for all rounds in one query
    const interviewIds = (humanInterviewRows || []).map((r) => r.id);
    const participantMap: Record<string, Array<{ userId: string; name: string; role: string; responseStatus: string }>> = {};

    if (interviewIds.length > 0) {
      const { data: participantRows } = await supabase
        .from("interview_participants")
        .select("human_interview_id, user_id, role, response_status, users(full_name)")
        .in("human_interview_id", interviewIds);

      for (const p of participantRows || []) {
        if (!participantMap[p.human_interview_id]) participantMap[p.human_interview_id] = [];
        participantMap[p.human_interview_id].push({
          userId: p.user_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (p as any).users?.full_name || "Team Member",
          role: p.role,
          responseStatus: p.response_status,
        });
      }
    }

    const humanInterviews = (humanInterviewRows || []).map((r) => ({
      id: r.id,
      roundNumber: r.round_number,
      interviewType: r.interview_type ?? null,
      scheduledAt: r.scheduled_at ?? null,
      status: r.status,
      feedback: r.feedback ?? null,
      rating: r.rating ?? null,
      notes: r.notes ?? null,
      calendarEventId: (r as Record<string, unknown>).calendar_event_id as string | null ?? null,
      meetingLink: (r as Record<string, unknown>).meeting_link as string | null ?? null,
      participants: participantMap[r.id] || [],
    }));

    // Also fetch notes and votes for this applicant
    const { data: notes } = await supabase
      .from("candidate_notes")
      .select("id, author_id, body, mentions, created_at, updated_at, users(full_name)")
      .eq("applicant_id", id)
      .order("created_at", { ascending: false });

    const { data: votes } = await supabase
      .from("candidate_votes")
      .select("id, voter_id, vote, created_at, updated_at, users(full_name)")
      .eq("applicant_id", id)
      .order("created_at", { ascending: false });

    // Resolve a signed PDF URL (1-hour TTL) if the applicant has a stored PDF
    let resumePdfUrl: string | null = null;
    try {
      // Look up the fitvector_applications row for this applicant to get tailored_resume_id
      const { data: fvApp } = await supabase
        .from("fitvector_applications")
        .select("tailored_resume_id")
        .eq("applicant_id", id)
        .single();

      if (fvApp?.tailored_resume_id) {
        const { data: resumeRow } = await supabase
          .from("tailored_resumes")
          .select("pdf_url")
          .eq("id", fvApp.tailored_resume_id)
          .single();

        if (resumeRow?.pdf_url) {
          // pdf_url is a storage path — generate a 1-hour signed URL
          const { data: signed } = await supabase.storage
            .from("resume-pdfs")
            .createSignedUrl(resumeRow.pdf_url, 3600);

          resumePdfUrl = signed?.signedUrl ?? null;
        }
      }
    } catch {
      // Non-critical — employer can still view parsed resume data
    }

    return NextResponse.json({
      data: {
        ...applicant,
        jobTitle: jobPost.title,
        resumePdfUrl,
        humanInterviews,
        notes: (notes || []).map((n) => ({
          id: n.id,
          authorId: n.author_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authorName: (n as any).users?.full_name || "Unknown",
          content: n.body,
          mentions: n.mentions || [],
          createdAt: n.created_at,
        })),
        votes: (votes || []).map((v) => ({
          id: v.id,
          voterId: v.voter_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          voterName: (v as any).users?.full_name || "Unknown",
          vote: v.vote,
          createdAt: v.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Applicant GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
