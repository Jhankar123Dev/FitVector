import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { interviewMessageSchema } from "@/lib/validators";
import { pythonClient } from "@/lib/python-client";

interface NextQuestionResult {
  next_question: string | null;
  is_complete: boolean;
}

// ─── POST: Send candidate answer, receive next question ───────────────────────
// Public route — no auth required (token is the credential)

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const parsed = interviewMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { answer, history } = parsed.data;
    const supabase = createAdminClient();

    // Fetch interview + job post in one query
    const { data: interview } = await supabase
      .from("ai_interviews")
      .select(`
        id, status, interview_type,
        job_posts (title, description, required_skills, interview_plan)
      `)
      .eq("id", token)
      .single();

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status !== "started") {
      return NextResponse.json(
        { error: `Interview is not active (status: ${interview.status})` },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jp = (interview as any).job_posts ?? {};

    // turn_number = number of completed Q&A pairs already in history
    // First call:  history=[], answer="" → turn_number=0 → Python returns opening question
    // Nth call:    history=[...n pairs]  → turn_number=n → Python returns question n+1 or done
    const turnNumber = history.length;
    const MAX_TURNS = 7;

    // Call Python for the next question
    let result: NextQuestionResult;
    try {
      result = await pythonClient.post<NextQuestionResult>(
        "/ai/next-interview-question",
        {
          job_title: jp.title ?? "",
          job_description: jp.description ?? "",
          required_skills: jp.required_skills ?? [],
          interview_type: interview.interview_type,
          interview_plan: jp.interview_plan ?? {},
          history: history, // completed turns only (not the current answer yet)
          turn_number: turnNumber,
          max_turns: MAX_TURNS,
        },
        { timeout: 30000 }
      );
    } catch (err) {
      console.error("Python service error in /message:", err);
      // Fallback questions so the interview never stalls
      const fallbacks = [
        `Tell me about your experience with ${(jp.required_skills ?? [])[0] ?? "the key technologies for this role"}.`,
        "Walk me through a challenging project you worked on recently.",
        "How do you approach problem-solving when you're stuck?",
        "Describe a time you had to learn something new quickly under pressure.",
        "What does good code quality mean to you?",
        "How do you handle disagreements with teammates?",
        "Is there anything else you'd like to highlight about your background?",
      ];
      const done = turnNumber >= MAX_TURNS;
      result = {
        next_question: done ? null : fallbacks[Math.min(turnNumber, fallbacks.length - 1)],
        is_complete: done,
      };
    }

    // Incrementally persist the transcript after every answered turn
    // This way a browser crash mid-interview doesn't lose prior responses
    if (answer.trim() && history.length > 0) {
      // The last entry in history is the question just answered; append it
      const lastQuestion = history[history.length - 1]?.question ?? "";
      const transcriptEntry = [
        { speaker: "ai", text: lastQuestion, timestamp: (history.length - 1) * 120 },
        { speaker: "candidate", text: answer.trim(), timestamp: (history.length - 1) * 120 + 60 },
      ];

      // Fetch existing transcript and append
      const { data: current } = await supabase
        .from("ai_interviews")
        .select("transcript")
        .eq("id", token)
        .single();

      const existing = Array.isArray(current?.transcript) ? current.transcript : [];
      await supabase
        .from("ai_interviews")
        .update({ transcript: [...existing, ...transcriptEntry] })
        .eq("id", token);
    }

    return NextResponse.json({
      nextQuestion: result.next_question,
      isComplete: result.is_complete,
      turnNumber: turnNumber + 1,
    });
  } catch (error) {
    console.error("Interview message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
