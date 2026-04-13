import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { z } from "zod";

const reinviteSchema = z.object({
  applicantId: z.string().uuid(),
});

// ─── POST: Re-invite a candidate for a new attempt ───────────────────────────
// IMPORTANT: This NEVER modifies or resets the existing submission row.
// A brand-new assessment_submissions row is created with attempt_number + 1,
// preserving the full history of all attempts for comparison.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id: assessmentId } = await params;
    const body = await req.json();
    const parsed = reinviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { applicantId } = parsed.data;
    const supabase = createAdminClient();

    // Verify the assessment belongs to this company
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, company_id")
      .eq("id", assessmentId)
      .eq("company_id", company.id)
      .single();

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Fetch the applicant to get their job_post_id
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, job_post_id")
      .eq("id", applicantId)
      .single();

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Count existing attempts — new attempt number = count + 1
    const { count: existingCount } = await supabase
      .from("assessment_submissions")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", assessmentId)
      .eq("applicant_id", applicantId);

    const attemptNumber = (existingCount ?? 0) + 1;

    // Create a brand-new submission row for this attempt.
    // The original row(s) are UNTOUCHED — all prior attempt data is preserved.
    const { data: newSub, error: insertErr } = await supabase
      .from("assessment_submissions")
      .insert({
        assessment_id:  assessmentId,
        applicant_id:   applicantId,
        job_post_id:    applicant.job_post_id,
        status:         "invited",
        invited_at:     new Date().toISOString(),
        attempt_number: attemptNumber,
      })
      .select("id")
      .single();

    if (insertErr || !newSub) {
      console.error("[reinvite] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to create re-invite" }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: { submissionId: newSub.id, attemptNumber },
        message: `Re-invite created (Attempt ${attemptNumber})`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Re-invite POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
