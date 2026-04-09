import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { addNoteSchema } from "@/lib/validators";

// ─── Ownership guard ─────────────────────────────────────────────────────────
// Verifies that the applicant belongs to a job posted by the employer's company.
// Returns 404 (not 403) for both missing and unauthorized cases — never reveal
// whether a resource exists to prevent IDOR enumeration.
async function verifyApplicantOwnership(
  supabase: ReturnType<typeof createAdminClient>,
  applicantId: string,
  companyId: string,
): Promise<boolean> {
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, job_post_id")
    .eq("id", applicantId)
    .single();

  if (!applicant) return false;

  const { data: jobPost } = await supabase
    .from("job_posts")
    .select("company_id")
    .eq("id", applicant.job_post_id)
    .eq("company_id", companyId)
    .single();

  return !!jobPost;
}

// ─── GET: List notes for applicant ───────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id: applicantId } = await params;
    const supabase = createAdminClient();

    // ── Ownership check: applicant must belong to this company ────────────────
    const isOwned = await verifyApplicantOwnership(supabase, applicantId, company.id);
    if (!isOwned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: rows, error } = await supabase
      .from("candidate_notes")
      .select("id, applicant_id, author_id, body, mentions, created_at, users(full_name)")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });

    const notes = (rows || []).map((row) => ({
      id: row.id,
      applicantId: row.applicant_id,
      authorId: row.author_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authorName: (row as any).users?.full_name || "Unknown",
      authorRole: "admin", // Simplified — would need company_members join for real role
      content: row.body,
      body: row.body,
      mentions: row.mentions || [],
      createdAt: row.created_at,
    }));

    return NextResponse.json({ data: notes });
  } catch (error) {
    console.error("Notes GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Add note ──────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { session, company } = result.data;
    const { id: applicantId } = await params;
    const body = await req.json();
    const parsed = addNoteSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();

    // ── Ownership check: applicant must belong to this company ────────────────
    const isOwned = await verifyApplicantOwnership(supabase, applicantId, company.id);
    if (!isOwned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: row, error } = await supabase
      .from("candidate_notes")
      .insert({
        applicant_id: applicantId,
        author_id: session.user.id,
        body: parsed.data.body,
        mentions: parsed.data.mentions,
      })
      .select("id, applicant_id, author_id, body, mentions, created_at")
      .single();

    if (error || !row) return NextResponse.json({ error: "Failed to add note" }, { status: 500 });

    return NextResponse.json({
      data: {
        id: row.id,
        applicantId: row.applicant_id,
        authorId: row.author_id,
        authorName: session.user.name || "You",
        content: row.body,
        mentions: row.mentions,
        createdAt: row.created_at,
      },
      message: "Note added",
    }, { status: 201 });
  } catch (error) {
    console.error("Notes POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
