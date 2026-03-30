import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

// ─── Validation ──────────────────────────────────────────────────────────────

const INTERVIEW_TYPES = [
  "technical",
  "behavioral",
  "hr",
  "culture_fit",
  "final",
] as const;

const updatePanelSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  interviewType: z.enum(INTERVIEW_TYPES).optional(),
  defaultInterviewerIds: z.array(z.string().uuid()).optional(),
  roundNumber: z.number().int().min(1).optional(),
  durationMinutes: z.number().int().min(15).optional(),
  description: z.string().max(2000).optional(),
});

// ─── Helper: verify panel belongs to company ────────────────────────────────

async function verifyPanelOwnership(panelId: string, companyId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_panels")
    .select("id, company_id")
    .eq("id", panelId)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  if (data.company_id !== companyId) return null;
  return data;
}

// ─── PUT: Update an interview panel ─────────────────────────────────────────

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

    const { company } = result.data;
    const { id } = await params;

    const panel = await verifyPanelOwnership(id, company.id);
    if (!panel) {
      return NextResponse.json(
        { error: "Panel not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updatePanelSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    const d = parsed.data;

    if (d.name !== undefined) updates.name = d.name;
    if (d.interviewType !== undefined) updates.interview_type = d.interviewType;
    if (d.defaultInterviewerIds !== undefined)
      updates.default_interviewer_ids = d.defaultInterviewerIds;
    if (d.roundNumber !== undefined) updates.round_number = d.roundNumber;
    if (d.durationMinutes !== undefined)
      updates.duration_minutes = d.durationMinutes;
    if (d.description !== undefined) updates.description = d.description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const supabase = createAdminClient();
    const { data: row, error } = await supabase
      .from("interview_panels")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Panel update error:", error);
      return NextResponse.json(
        { error: "Failed to update panel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error("Panel PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft delete an interview panel ──────────────────────────────────

export async function DELETE(
  _req: Request,
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

    const { company } = result.data;
    const { id } = await params;

    const panel = await verifyPanelOwnership(id, company.id);
    if (!panel) {
      return NextResponse.json(
        { error: "Panel not found" },
        { status: 404 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("interview_panels")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Panel delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete panel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Panel DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
