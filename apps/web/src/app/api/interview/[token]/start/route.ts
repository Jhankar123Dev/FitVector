import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── POST: Start interview session (public, no auth) ─────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: interview } = await supabase
      .from("ai_interviews")
      .select("id, status")
      .eq("id", token)
      .single();

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status !== "invited") {
      return NextResponse.json(
        { error: `Cannot start: interview status is '${interview.status}'` },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("ai_interviews")
      .update({
        status: "started",
        started_at: new Date().toISOString(),
      })
      .eq("id", token)
      .select("id, status, started_at")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Failed to start interview" }, { status: 500 });
    }

    return NextResponse.json({
      data: { id: updated.id, status: updated.status, startedAt: updated.started_at },
      message: "Interview started",
    });
  } catch (error) {
    console.error("Interview start error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
