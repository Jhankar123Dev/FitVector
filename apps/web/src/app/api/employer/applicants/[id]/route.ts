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

    return NextResponse.json({
      data: {
        ...applicant,
        jobTitle: jobPost.title,
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
