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

const createPanelSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  interviewType: z.enum(INTERVIEW_TYPES, {
    errorMap: () => ({ message: "Invalid interview type" }),
  }),
  defaultInterviewerIds: z.array(z.string().uuid()).optional().default([]),
  roundNumber: z.number().int().min(1, "Round number must be at least 1"),
  durationMinutes: z.number().int().min(15).optional().default(60),
  description: z.string().max(2000).optional().default(""),
});

// ─── GET: List all interview panels for company ─────────────────────────────

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { company } = result.data;
    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from("interview_panels")
      .select("*")
      .eq("company_id", company.id)
      .eq("is_active", true)
      .order("round_number", { ascending: true });

    if (error) {
      console.error("Panels fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch panels" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: rows || [] });
  } catch (error) {
    console.error("Panels GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new interview panel ─────────────────────────────────────

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { company } = result.data;
    const body = await req.json();

    const parsed = createPanelSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      name,
      interviewType,
      defaultInterviewerIds,
      roundNumber,
      durationMinutes,
      description,
    } = parsed.data;

    const supabase = createAdminClient();

    const { data: row, error } = await supabase
      .from("interview_panels")
      .insert({
        company_id: company.id,
        name,
        interview_type: interviewType,
        default_interviewer_ids: defaultInterviewerIds,
        round_number: roundNumber,
        duration_minutes: durationMinutes,
        description,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Panel create error:", error);
      return NextResponse.json(
        { error: "Failed to create panel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    console.error("Panels POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
