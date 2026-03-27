import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { changeJobStatusSchema } from "@/lib/validators";
import { transformJobPost, insertIntoJobsTable } from "@/lib/job-post-helpers";

// ─── PUT: Change job post status (publish/pause/close/fill) ──────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const { id } = await params;
    const body = await req.json();
    const parsed = changeJobStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const newStatus = parsed.data.status;

    // Fetch current job post
    const { data: existing } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", id)
      .eq("company_id", company.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    // Validate status transitions
    const currentStatus = existing.status as string;
    const validTransitions: Record<string, string[]> = {
      draft: ["active"],
      active: ["paused", "closed", "filled"],
      paused: ["active", "closed"],
      closed: [], // terminal
      filled: [], // terminal
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot change status from '${currentStatus}' to '${newStatus}'` },
        { status: 400 }
      );
    }

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from("job_posts")
      .update({ status: newStatus })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Status change error:", updateError);
      return NextResponse.json({ error: "Failed to change status" }, { status: 500 });
    }

    // On publish (draft→active or paused→active): insert/reactivate in jobs table
    if (newStatus === "active") {
      await insertIntoJobsTable(supabase, updated, {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        websiteUrl: company.websiteUrl,
      });
    }

    // On close/pause: deactivate in jobs table
    if (newStatus === "closed" || newStatus === "paused" || newStatus === "filled") {
      await supabase
        .from("jobs")
        .update({ is_active: false })
        .eq("job_post_id", id);
    }

    return NextResponse.json({
      data: transformJobPost(updated),
      message: `Job ${newStatus === "active" ? "published" : newStatus}`,
    });
  } catch (error) {
    console.error("Status PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
