import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { castVoteSchema } from "@/lib/validators";

// ─── GET: List votes for applicant ───────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { id: applicantId } = await params;
    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from("candidate_votes")
      .select("id, applicant_id, voter_id, vote, created_at, updated_at, users(full_name)")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });

    const votes = (rows || []).map((row) => ({
      id: row.id,
      candidateId: row.applicant_id,
      voterId: row.voter_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      voterName: (row as any).users?.full_name || "Unknown",
      voterRole: "admin", // Simplified
      vote: row.vote,
      comment: null,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ data: votes });
  } catch (error) {
    console.error("Votes GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Cast/update vote (upsert) ────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { session } = result.data;
    const { id: applicantId } = await params;
    const body = await req.json();
    const parsed = castVoteSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();

    // Upsert: insert or update on conflict (applicant_id, voter_id)
    const { data: row, error } = await supabase
      .from("candidate_votes")
      .upsert(
        {
          applicant_id: applicantId,
          voter_id: session.user.id,
          vote: parsed.data.vote,
        },
        { onConflict: "applicant_id,voter_id" }
      )
      .select("id, applicant_id, voter_id, vote, created_at")
      .single();

    if (error || !row) {
      console.error("Vote upsert error:", error);
      return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        id: row.id,
        candidateId: row.applicant_id,
        voterId: row.voter_id,
        voterName: session.user.name || "You",
        vote: row.vote,
        createdAt: row.created_at,
      },
      message: "Vote recorded",
    });
  } catch (error) {
    console.error("Vote POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
