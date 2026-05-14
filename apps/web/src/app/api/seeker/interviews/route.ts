import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSeekerSession } from "@/lib/seeker-auth";

// ─── Unified interview shape returned to the seeker ───────────────────────────

export interface SeekerInterview {
  id: string;
  /** "ai" = async AI interview, "human" = scheduled call with employer */
  type: "ai" | "human";
  jobTitle: string;
  companyName: string;
  status: string;
  interviewType: string | null;
  roundNumber: number | null;       // human only
  scheduledAt: string | null;       // human only
  durationMinutes: number | null;   // human only
  meetingLink: string | null;       // human only
  invitedAt: string | null;         // ai only
  expiresAt: string | null;         // ai only
  /** Ready-to-use URL: /interview/[id] for AI, meeting link for human */
  actionUrl: string;
}

// ─── GET: All pending/upcoming interviews for the logged-in seeker ────────────

export async function GET() {
  try {
    const result = await getSeekerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { user } = result.data;
    const supabase = createAdminClient();

    // ── Step 1: Resolve the seeker's applicant IDs ────────────────────────────
    // applicants.user_id is a direct FK to users.id — no need to go via
    // fitvector_applications (confirmed from existing /api/seeker/interviews/[id])
    const { data: applicantRows } = await supabase
      .from("applicants")
      .select("id")
      .eq("user_id", user.id);

    const applicantIds = (applicantRows || []).map((a) => a.id);

    if (applicantIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // ── Step 2: Fetch AI interviews + human interviews in parallel ─────────────
    const [aiRes, humanRes] = await Promise.all([
      // AI interviews: invited or in-progress only
      supabase
        .from("ai_interviews")
        .select("id, status, interview_type, invite_sent_at, invite_expires_at, job_post_id")
        .in("applicant_id", applicantIds)
        .in("status", ["invited", "started"])
        .order("invite_sent_at", { ascending: false }),

      // Human interviews: scheduled + in the future only
      supabase
        .from("human_interviews")
        .select("id, status, interview_type, round_number, scheduled_at, duration_minutes, meeting_link, job_post_id")
        .in("applicant_id", applicantIds)
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true }),
    ]);

    // ── Step 3: Collect all job_post_ids → batch fetch titles + company_ids ───
    const jobPostIds = new Set<string>();
    for (const ai of aiRes.data || []) if (ai.job_post_id) jobPostIds.add(ai.job_post_id);
    for (const hi of humanRes.data || []) if (hi.job_post_id) jobPostIds.add(hi.job_post_id);

    const jobPostMap: Record<string, { title: string; company_id: string }> = {};
    if (jobPostIds.size > 0) {
      const { data: jobPosts } = await supabase
        .from("job_posts")
        .select("id, title, company_id")
        .in("id", [...jobPostIds]);
      for (const jp of jobPosts || []) {
        jobPostMap[jp.id] = { title: jp.title, company_id: jp.company_id };
      }
    }

    // ── Step 4: Collect all company_ids → batch fetch names ───────────────────
    const companyIds = new Set<string>(
      Object.values(jobPostMap).map((jp) => jp.company_id).filter(Boolean)
    );

    const companyNameMap: Record<string, string> = {};
    if (companyIds.size > 0) {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", [...companyIds]);
      for (const c of companies || []) {
        companyNameMap[c.id] = c.name;
      }
    }

    // ── Step 5: Build unified response ────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const interviews: SeekerInterview[] = [];

    for (const ai of aiRes.data || []) {
      const jp = ai.job_post_id ? jobPostMap[ai.job_post_id] : null;
      interviews.push({
        id: ai.id,
        type: "ai",
        jobTitle: jp?.title ?? "Unknown Role",
        companyName: jp?.company_id ? (companyNameMap[jp.company_id] ?? "Unknown Company") : "Unknown Company",
        status: ai.status,
        interviewType: ai.interview_type ?? null,
        roundNumber: null,
        scheduledAt: null,
        durationMinutes: null,
        meetingLink: null,
        invitedAt: ai.invite_sent_at ?? null,
        expiresAt: ai.invite_expires_at ?? null,
        actionUrl: `${baseUrl}/interview/${ai.id}`,
      });
    }

    for (const hi of humanRes.data || []) {
      const jp = hi.job_post_id ? jobPostMap[hi.job_post_id] : null;
      interviews.push({
        id: hi.id,
        type: "human",
        jobTitle: jp?.title ?? "Unknown Role",
        companyName: jp?.company_id ? (companyNameMap[jp.company_id] ?? "Unknown Company") : "Unknown Company",
        status: hi.status,
        interviewType: hi.interview_type ?? null,
        roundNumber: hi.round_number ?? null,
        scheduledAt: hi.scheduled_at ?? null,
        durationMinutes: hi.duration_minutes ?? null,
        meetingLink: hi.meeting_link ?? null,
        invitedAt: null,
        expiresAt: null,
        actionUrl: hi.meeting_link ?? "#",
      });
    }

    // AI interviews first (no fixed time, seeker can act now),
    // then human interviews sorted by scheduled_at ascending (already ordered by DB)
    const aiItems = interviews.filter((i) => i.type === "ai");
    const humanItems = interviews.filter((i) => i.type === "human");

    return NextResponse.json({ data: [...aiItems, ...humanItems] });
  } catch (err) {
    console.error("Seeker interviews GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
