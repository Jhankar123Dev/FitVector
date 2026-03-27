import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getEmployerSession,
  requireRole,
  transformMember,
} from "@/lib/employer-auth";
import { updateMemberSchema } from "@/lib/validators";

// ─── PUT: Update a team member's role or status ──────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { company, membership } = result.data;
    const { id: memberId } = await params;

    // Only admins can update members
    if (!requireRole(membership, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can update team members" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify the target member belongs to this company
    const { data: targetMember } = await supabase
      .from("company_members")
      .select("id, role, status, user_id")
      .eq("id", memberId)
      .eq("company_id", company.id)
      .single();

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Prevent demoting the last admin
    if (
      targetMember.role === "admin" &&
      parsed.data.role &&
      parsed.data.role !== "admin"
    ) {
      const { count } = await supabase
        .from("company_members")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("role", "admin")
        .eq("status", "active");

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot change role: this is the only admin" },
          { status: 400 }
        );
      }
    }

    // Prevent deactivating the last admin
    if (
      targetMember.role === "admin" &&
      parsed.data.status === "deactivated"
    ) {
      const { count } = await supabase
        .from("company_members")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("role", "admin")
        .eq("status", "active");

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot deactivate: this is the only admin" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const update: Record<string, unknown> = {};
    if (parsed.data.role !== undefined) update.role = parsed.data.role;
    if (parsed.data.status !== undefined) update.status = parsed.data.status;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({
        data: transformMember(targetMember),
        message: "No changes",
      });
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("company_members")
      .update(update)
      .eq("id", memberId)
      .select("*")
      .single();

    if (updateError || !updatedRow) {
      console.error("Member update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: transformMember(updatedRow),
      message: "Member updated successfully",
    });
  } catch (error) {
    console.error("Member PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
