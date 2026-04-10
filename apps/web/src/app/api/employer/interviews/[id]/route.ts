import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { transformInterview } from "@/lib/interview-helpers";

// ─── GET: Single interview detail + report ───────────────────────────────────

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

    const { data: row, error } = await supabase
      .from("ai_interviews")
      .select(`
        *,
        applicants (name, email, role_title, current_company),
        job_posts (title, company_id)
      `)
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    if (r.job_posts?.company_id !== company.id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: transformInterview(row, r.applicants || {}, r.job_posts?.title || ""),
    });
  } catch (error) {
    console.error("Interview detail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Update a human interview ───────────────────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const supabase = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (body.scheduledAt    !== undefined) patch.scheduled_at      = body.scheduledAt;
    if (body.meetingLink    !== undefined) patch.meeting_link       = body.meetingLink;
    if (body.notes          !== undefined) patch.notes              = body.notes;
    if (body.status         !== undefined) patch.status             = body.status;
    if (body.durationMins   !== undefined) patch.duration_minutes   = body.durationMins;
    if (body.interviewerId  !== undefined) patch.interviewer_id     = body.interviewerId;

    const { error } = await supabase.from("human_interviews").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
    return NextResponse.json({ message: "Updated" });
  } catch (err) {
    console.error("interview PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Cancel a human interview ────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const { id } = await params;
    const supabase = createAdminClient();
    await supabase.from("human_interviews").update({ status: "cancelled" }).eq("id", id);
    return NextResponse.json({ message: "Cancelled" });
  } catch (err) {
    console.error("interview DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
