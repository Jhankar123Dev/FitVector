import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActivityItem {
  id: string;
  type: "new_applicant" | "ai_interview_completed" | "interview_scheduled" | "job_posted" | "offer_sent";
  message: string;
  candidateName: string | null;
  jobTitle: string;
  actionUrl: string;
  timestamp: string;
}

// ─── GET: Recent activity feed for the employer dashboard ─────────────────────

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Resolve company
    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", session.user.id)
      .single();

    if (!membership?.company_id) {
      return NextResponse.json({ data: [] });
    }

    const companyId = membership.company_id;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // last 30 days

    // Fetch in parallel: new applicants, scheduled interviews, new job posts
    const [applicantsRes, interviewsRes, jobsRes] = await Promise.all([
      supabase
        .from("applicants")
        .select("id, name, pipeline_stage, created_at, job_post_id, job_posts(title, id)")
        .eq("job_posts.company_id", companyId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("scheduled_interviews")
        .select("id, applicant_id, scheduled_at, applicants(name, job_post_id, job_posts(title, id))")
        .eq("company_id", companyId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("job_posts")
        .select("id, title, created_at")
        .eq("company_id", companyId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const items: ActivityItem[] = [];

    // New applicants
    for (const a of applicantsRes.data || []) {
      const jp = (a.job_posts as unknown as Record<string, unknown> | null);
      if (!jp) continue;
      items.push({
        id: `applicant-${a.id}`,
        type: "new_applicant",
        message: "New application from",
        candidateName: a.name,
        jobTitle: String(jp.title ?? ""),
        actionUrl: `/employer/applicants/${a.id}`,
        timestamp: a.created_at,
      });
    }

    // Scheduled interviews
    for (const iv of interviewsRes.data || []) {
      const applicant = (iv.applicants as unknown as Record<string, unknown> | null);
      const jp = applicant ? (applicant.job_posts as Record<string, unknown> | null) : null;
      items.push({
        id: `interview-${iv.id}`,
        type: "interview_scheduled",
        message: "Interview scheduled with",
        candidateName: applicant ? String(applicant.name ?? "") : null,
        jobTitle: jp ? String(jp.title ?? "") : "Unknown job",
        actionUrl: `/employer/interviews`,
        timestamp: iv.scheduled_at,
      });
    }

    // Job posts
    for (const jp of jobsRes.data || []) {
      items.push({
        id: `job-${jp.id}`,
        type: "job_posted",
        message: "New job posted:",
        candidateName: null,
        jobTitle: jp.title,
        actionUrl: `/employer/jobs/${jp.id}`,
        timestamp: jp.created_at,
      });
    }

    // Sort all items by timestamp descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ data: items.slice(0, 10) });
  } catch (err) {
    console.error("Activity feed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
