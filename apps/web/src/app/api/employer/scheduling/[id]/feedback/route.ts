import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { submitFeedbackSchema } from "@/lib/validators";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const { id } = await params;
    const body = await req.json();
    const parsed = submitFeedbackSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();

    // Verify ownership
    const { data: interview } = await supabase.from("human_interviews").select("id, job_post_id").eq("id", id).single();
    if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: jp } = await supabase.from("job_posts").select("company_id").eq("id", interview.job_post_id).single();
    if (!jp || jp.company_id !== company.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { error } = await supabase
      .from("human_interviews")
      .update({
        rating: parsed.data.rating,
        feedback: parsed.data.feedback || null,
        notes: parsed.data.notes || null,
        status: "completed",
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });

    return NextResponse.json({ message: "Feedback submitted" });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
