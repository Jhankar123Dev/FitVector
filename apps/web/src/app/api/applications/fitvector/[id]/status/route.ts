import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET: Real-time status for a FitVector application ───────────────────────

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
      .select("id, status, status_timeline, status_updated_at, is_boosted, boost_tier, updated_at")
      .eq("id", id)
      .eq("applicant_user_id", session.user.id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: row.id,
        status: `fv_${row.status}`,
        statusTimeline: row.status_timeline || [],
        statusUpdatedAt: row.status_updated_at,
        isBoosted: row.is_boosted || false,
        boostTier: row.boost_tier || null,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error("FV status GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
