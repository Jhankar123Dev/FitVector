import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET /api/jobs/post/[id] ──────────────────────────────────────────────────
// Public route — returns title + screening_questions for a FitVector job post.
// Used by the apply modal to load real screening questions from the DB.

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing job post id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: jobPost, error } = await supabase
    .from("job_posts")
    .select("id, title, screening_questions")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !jobPost) {
    return NextResponse.json({ error: "Job post not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: jobPost.id,
      title: jobPost.title,
      screeningQuestions: (jobPost.screening_questions as Array<{
        id: string;
        question: string;
        type: "short_answer" | "yes_no" | "multiple_choice";
        required: boolean;
      }>) ?? [],
    },
  });
}
