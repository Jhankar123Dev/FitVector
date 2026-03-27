import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── POST: Start assessment timer (public) ───────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: submission } = await supabase
      .from("assessment_submissions")
      .select("id, status")
      .eq("id", token)
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (submission.status !== "invited") {
      return NextResponse.json(
        { error: `Cannot start: status is '${submission.status}'` },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("assessment_submissions")
      .update({
        status: "started",
        started_at: new Date().toISOString(),
      })
      .eq("id", token)
      .select("id, status, started_at")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Failed to start" }, { status: 500 });
    }

    return NextResponse.json({
      data: { id: updated.id, status: updated.status, startedAt: updated.started_at },
      message: "Assessment started",
    });
  } catch (error) {
    console.error("Assessment start error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
