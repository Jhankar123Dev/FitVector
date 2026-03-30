import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Find all applicant records linked to this user (by user_id or email)
    const { data: applicants, error: applicantsError } = await supabase
      .from("applicants")
      .select("id")
      .or(
        `user_id.eq.${session.user.id}${session.user.email ? `,email.eq.${session.user.email}` : ""}`,
      );

    if (applicantsError) {
      console.error("Error fetching applicants:", applicantsError);
      return NextResponse.json(
        { error: "Failed to fetch applicant records" },
        { status: 500 },
      );
    }

    if (!applicants || applicants.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const applicantIds = applicants.map((a) => a.id);

    const { data: submissions, error: submissionsError } = await supabase
      .from("assessment_submissions")
      .select(
        `
        id,
        status,
        started_at,
        submitted_at,
        time_taken_minutes,
        auto_score,
        final_score,
        created_at,
        assessments:assessment_id (
          id,
          title,
          assessment_type,
          time_limit_minutes,
          difficulty,
          passing_score
        ),
        job_posts:job_post_id (
          id,
          title
        )
      `,
      )
      .in("applicant_id", applicantIds)
      .order("created_at", { ascending: false });

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      return NextResponse.json(
        { error: "Failed to fetch test submissions" },
        { status: 500 },
      );
    }

    const tests = (submissions ?? []).map((sub) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assessment = sub.assessments as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jobPost = sub.job_posts as any;

      return {
        id: sub.id,
        assessmentName: (assessment?.title as string) ?? "Untitled Assessment",
        assessmentType: (assessment?.assessment_type as string) ?? "unknown",
        jobTitle: (jobPost?.title as string) ?? "Unknown Position",
        status: sub.status,
        finalScore: sub.final_score,
        autoScore: sub.auto_score,
        passingScore: (assessment?.passing_score as number) ?? null,
        timeLimit: (assessment?.time_limit_minutes as number) ?? null,
        startedAt: sub.started_at,
        submittedAt: sub.submitted_at,
        createdAt: sub.created_at,
      };
    });

    return NextResponse.json({ data: tests });
  } catch (error) {
    console.error("Error in GET /api/user/tests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
