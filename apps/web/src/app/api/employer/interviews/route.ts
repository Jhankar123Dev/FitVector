import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformInterview } from "@/lib/interview-helpers";

// ─── GET: List all AI interviews for company ─────────────────────────────────

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    // Get company job post IDs
    const { data: jobPosts } = await supabase
      .from("job_posts")
      .select("id")
      .eq("company_id", company.id);

    const jpIds = (jobPosts || []).map((jp) => jp.id);
    if (jpIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch interviews with joined data
    let query = supabase
      .from("ai_interviews")
      .select(`
        *,
        applicants (name, email, role_title, current_company),
        job_posts (title)
      `)
      .in("job_post_id", jpIds)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Interviews fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
    }

    const interviews = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      return transformInterview(
        row,
        r.applicants || {},
        r.job_posts?.title || "",
      );
    });

    return NextResponse.json({ data: interviews });
  } catch (error) {
    console.error("Interviews GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Create a human interview ──────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const body = await req.json() as {
      applicantId:   string;
      jobPostId:     string;
      interviewerId: string;
      scheduledAt:   string;
      durationMins?: number;
      format?:       string;
      meetingLink?:  string;
      notes?:        string;
    };

    const supabase = createAdminClient();

    // Create human_interview row (uses existing table from migration 20260327)
    const { data: interview, error } = await supabase
      .from("human_interviews")
      .insert({
        applicant_id:     body.applicantId,
        job_post_id:      body.jobPostId,
        interviewer_id:   body.interviewerId,
        round_number:     1,
        interview_type:   "technical",
        scheduled_at:     body.scheduledAt,
        duration_minutes: body.durationMins ?? 60,
        format:           body.format ?? "video",
        meeting_link:     body.meetingLink ?? null,
        notes:            body.notes ?? null,
        status:           "scheduled",
      })
      .select("id")
      .single();

    if (error || !interview) {
      console.error("interview create error:", error);
      return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
    }

    // Add lead interviewer to participants table
    await supabase.from("interview_participants").insert({
      human_interview_id: interview.id,
      user_id:            body.interviewerId,
      role:               "lead",
    });

    // Advance applicant to interview_scheduled stage
    await supabase
      .from("applicants")
      .update({ pipeline_stage: "interview_scheduled" })
      .eq("id", body.applicantId);

    return NextResponse.json({ data: { id: interview.id } }, { status: 201 });
  } catch (err) {
    console.error("interviews POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
