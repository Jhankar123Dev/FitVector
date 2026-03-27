import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: applicant } = await supabase
      .from("applicants")
      .select("name, email")
      .eq("id", id)
      .single();

    if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Log re-engagement (no real email for MVP)
    console.log(`[Re-engage] Sending re-engagement email to ${applicant.name} (${applicant.email})`);

    return NextResponse.json({ message: `Re-engagement email logged for ${applicant.name}` });
  } catch (error) {
    console.error("Reengage POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
