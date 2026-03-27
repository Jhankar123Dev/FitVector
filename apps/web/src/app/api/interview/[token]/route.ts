import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET: Get interview info for candidate (public, no auth) ─────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: interview, error } = await supabase
      .from("ai_interviews")
      .select(`
        id, interview_type, duration_planned, status,
        invite_sent_at, invite_expires_at, started_at,
        applicants (name, email),
        job_posts (title, description, required_skills, interview_plan)
      `)
      .eq("id", token)
      .single();

    if (error || !interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Check if expired
    if (interview.invite_expires_at && new Date(interview.invite_expires_at) < new Date()) {
      if (interview.status === "invited") {
        // Mark as expired
        await supabase.from("ai_interviews").update({ status: "expired" }).eq("id", token);
        return NextResponse.json({ error: "Interview invite has expired" }, { status: 410 });
      }
    }

    if (interview.status === "cancelled") {
      return NextResponse.json({ error: "Interview has been cancelled" }, { status: 410 });
    }

    if (interview.status === "completed") {
      return NextResponse.json({ error: "Interview has already been completed" }, { status: 410 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = interview as any;
    const interviewPlan = r.job_posts?.interview_plan;
    const customQuestions = interviewPlan?.customQuestions || [];

    // Generate default questions if none configured
    const questions = customQuestions.length > 0
      ? customQuestions
      : getDefaultQuestions(interview.interview_type, r.job_posts?.required_skills || []);

    return NextResponse.json({
      data: {
        id: interview.id,
        status: interview.status,
        interviewType: interview.interview_type,
        durationPlanned: interview.duration_planned,
        candidateName: r.applicants?.name || "Candidate",
        jobTitle: r.job_posts?.title || "",
        questions,
      },
    });
  } catch (error) {
    console.error("Interview GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Default questions by interview type ─────────────────────────────────────

function getDefaultQuestions(type: string, skills: string[]): string[] {
  const skillStr = skills.slice(0, 3).join(", ");

  switch (type) {
    case "technical":
      return [
        `Describe your experience with ${skillStr || "the key technologies"} in this role.`,
        "Walk me through a challenging technical problem you solved recently. What was your approach?",
        "How do you approach code review and maintaining code quality in a team?",
        "Describe your experience with system design. How would you design a scalable API?",
        "What's your approach to debugging production issues?",
      ];
    case "behavioral":
      return [
        "Tell me about a time you had a conflict with a teammate. How did you resolve it?",
        "Describe a situation where you had to meet a tight deadline. What did you do?",
        "Give an example of when you took initiative beyond your role expectations.",
        "How do you handle feedback, especially when you disagree with it?",
        "Tell me about a failure and what you learned from it.",
      ];
    case "role_specific":
      return [
        `What excites you about this role and working with ${skillStr || "these technologies"}?`,
        "Describe your ideal working environment and how you stay productive.",
        "What's the most impactful project you've worked on and why?",
        "How do you stay updated with the latest developments in your field?",
        "Where do you see yourself in 2-3 years?",
      ];
    default:
      return [
        "Tell me about yourself and your current role.",
        `What interests you about this position?`,
        "Describe your greatest professional achievement.",
        "How do you approach learning new skills or technologies?",
        "Do you have any questions about the role or company?",
      ];
  }
}
