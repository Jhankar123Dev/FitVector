import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSeekerSession } from "@/lib/seeker-auth";

// ─── GET: Seeker's own interview report (sanitized — no scores or recommendations) ──
//
// PRIVACY RULE: seekers may only see constructive feedback on their own performance.
// The following fields are INTENTIONALLY excluded from this response:
//   - overallScore       (numeric score used for employer comparison)
//   - aiRecommendation  (hire/reject decision — employer-only)
//   - cheatingConfidence / cheatingSignals  (proctoring data — employer-only)
//
// Returned:
//   status, interviewType, completedAt, transcript, executiveSummary,
//   strengths, concerns (reframed as "areas to grow"), skillRatings, communicationScores

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getSeekerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { user } = result.data;
    const { id } = await params;
    const supabase = createAdminClient();

    // Look up the interview — joined to applicants so we can verify ownership
    const { data: row, error } = await supabase
      .from("ai_interviews")
      .select(`
        id,
        status,
        interview_type,
        duration_planned,
        started_at,
        completed_at,
        transcript,
        evaluation_report,
        skill_scores,
        strengths,
        concerns,
        communication_assessment,
        applicant_id,
        job_post_id,
        applicants!inner (
          user_id,
          name
        ),
        job_posts (
          title
        )
      `)
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;

    // Security: verify this interview belongs to the requesting seeker
    if (r.applicants?.user_id !== user.id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Only expose if interview is completed — partial data mid-session has no value
    if (r.status !== "completed") {
      return NextResponse.json(
        { error: "Report not yet available — interview has not been completed." },
        { status: 422 }
      );
    }

    const evalReport = (r.evaluation_report as Record<string, unknown>) || {};

    // Transform transcript: array of { speaker, text, timestamp }
    type TranscriptRow = { role?: string; speaker?: string; content?: string; text?: string; timestamp?: string };
    const transcript: { speaker: "ai" | "candidate"; text: string; timestamp: string }[] =
      Array.isArray(r.transcript)
        ? (r.transcript as TranscriptRow[]).map((t) => ({
            speaker: (t.role === "assistant" || t.speaker === "ai") ? "ai" : "candidate",
            text: (t.content ?? t.text ?? "") as string,
            timestamp: (t.timestamp ?? "") as string,
          }))
        : [];

    // Transform skill ratings
    type SkillRow = { skill?: string; score?: number; justification?: string };
    const skillRatings: { skill: string; score: number; note: string }[] =
      Array.isArray(r.skill_scores)
        ? (r.skill_scores as SkillRow[]).map((s) => ({
            skill: s.skill ?? "",
            score: s.score ?? 0,
            note: s.justification ?? "",
          }))
        : [];

    // Transform communication scores
    type CommRow = { label?: string; dimension?: string; score?: number; note?: string };
    const commAssessment = Array.isArray(r.communication_assessment) ? r.communication_assessment as CommRow[] : [];
    const communicationScores: { label: string; score: number; note: string }[] =
      commAssessment.map((c) => ({
        label: c.label ?? c.dimension ?? "",
        score: c.score ?? 0,
        note: c.note ?? "",
      }));

    // Sanitized response — employer-only fields deliberately omitted
    return NextResponse.json({
      data: {
        id: r.id as string,
        status: r.status as string,
        interviewType: r.interview_type as string,
        durationPlanned: r.duration_planned as number,
        completedAt: r.completed_at as string | null,
        jobTitle: (r.job_posts as { title?: string } | null)?.title ?? "",
        candidateName: (r.applicants as { name?: string } | null)?.name ?? "",

        // Constructive feedback (seeker-safe)
        executiveSummary: (evalReport.summary as string) || null,
        strengths: (r.strengths as string[]) || [],
        areasToGrow: (r.concerns as string[]) || [], // renamed from "concerns" to be constructive
        skillRatings,
        communicationScores,

        // Full transcript so candidate can review what they said
        transcript,
      },
    });
  } catch (error) {
    console.error("Seeker interview report GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
