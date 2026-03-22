import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateApplicationSchema } from "@/lib/validators";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: app, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (error || !app) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    return Response.json({ data: app });
  } catch (error) {
    console.error("Tracker GET error:", error);
    return Response.json({ error: "Failed to load application" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Build update object
    const updates: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.positionOrder !== undefined) updates.position_order = parsed.data.positionOrder;
    if (parsed.data.nextFollowupDate !== undefined) updates.next_followup_date = parsed.data.nextFollowupDate;
    if (parsed.data.contactName !== undefined) updates.contact_name = parsed.data.contactName;
    if (parsed.data.contactEmail !== undefined) updates.contact_email = parsed.data.contactEmail;
    if (parsed.data.contactRole !== undefined) updates.contact_role = parsed.data.contactRole;

    // If status changed, append to status_history
    if (parsed.data.status) {
      const { data: current } = await supabase
        .from("applications")
        .select("status_history")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      const history = (current?.status_history as Array<{ status: string; changed_at: string }>) || [];
      history.push({
        status: parsed.data.status,
        changed_at: new Date().toISOString(),
      });
      updates.status_history = history;

      if (parsed.data.status === "applied") {
        updates.applied_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Update application error:", error);
      return Response.json({ error: "Failed to update" }, { status: 500 });
    }

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error("Tracker PUT error:", error);
    return Response.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Soft delete (archive)
    const { error } = await supabase
      .from("applications")
      .update({ is_archived: true })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      return Response.json({ error: "Failed to delete" }, { status: 500 });
    }

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error("Tracker DELETE error:", error);
    return Response.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
