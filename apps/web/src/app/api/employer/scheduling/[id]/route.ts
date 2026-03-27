import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { rescheduleInterviewSchema } from "@/lib/validators";
import { transformHumanInterview } from "@/lib/scheduling-helpers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id } = await params;
    const body = await req.json();
    const parsed = rescheduleInterviewSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("human_interviews")
      .select("id, job_post_id, scheduled_at")
      .eq("id", id)
      .single();

    if (!existing) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    const { data: jp } = await supabase.from("job_posts").select("company_id").eq("id", existing.job_post_id).single();
    if (!jp || jp.company_id !== company.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const update: Record<string, unknown> = {};
    if (parsed.data.scheduledAt) {
      update.scheduled_at = parsed.data.scheduledAt;
      update.rescheduled_from = existing.scheduled_at;
      update.status = "rescheduled";
    }
    if (parsed.data.status) update.status = parsed.data.status;
    if (parsed.data.durationMinutes) update.duration_minutes = parsed.data.durationMinutes;
    if (parsed.data.meetingLink !== undefined) update.meeting_link = parsed.data.meetingLink;

    const { data: updated, error } = await supabase
      .from("human_interviews")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

    return NextResponse.json({ data: transformHumanInterview(updated), message: "Interview updated" });
  } catch (error) {
    console.error("Reschedule PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
