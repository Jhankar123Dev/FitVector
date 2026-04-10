import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET: Full detail for a single FitVector application ─────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: row, error } = await supabase
      .from("fitvector_applications")
      .select(
        "id, status, status_timeline, status_updated_at, is_boosted, boost_tier, " +
        "resume_name, match_score, screening_responses, interest_note, created_at"
      )
      .eq("id", id)
      .eq("applicant_user_id", session.user.id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const r = row as unknown as {
      id: string;
      status: string;
      status_timeline: unknown[];
      status_updated_at: string;
      is_boosted: boolean;
      boost_tier: string | null;
      resume_name: string | null;
      match_score: number | null;
      screening_responses: unknown[];
      interest_note: string | null;
      created_at: string;
    };

    return NextResponse.json({
      data: {
        id:               r.id,
        status:           `fv_${r.status}`,
        statusTimeline:   r.status_timeline   || [],
        statusUpdatedAt:  r.status_updated_at,
        isBoosted:        r.is_boosted        || false,
        boostTier:        r.boost_tier        || null,
        resumeName:       r.resume_name       || null,
        matchScore:       r.match_score       ?? null,
        screeningAnswers: r.screening_responses || [],
        coverNote:        r.interest_note     || null,
        appliedAt:        r.created_at,
      },
    });
  } catch (err) {
    console.error("FV application detail GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
