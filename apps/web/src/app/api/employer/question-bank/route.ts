import { NextResponse } from "next/server";
import { getEmployerSession } from "@/lib/employer-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface QuestionBankItem {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  starterCode: Record<string, string>; // { python3: "...", nodejs: "...", java: "...", cpp17: "..." }
  testCases: { input: string; expectedOutput: string }[];
  tags: string[];
}

export async function GET(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty"); // easy | medium | hard
    const category = searchParams.get("category");     // Arrays | Strings | etc.

    const supabase = createAdminClient();

    // solution_code intentionally excluded — never sent to client
    let query = supabase
      .from("question_bank")
      .select("id, title, category, difficulty, prompt, starter_code, test_cases, tags")
      .order("category")
      .order("difficulty");

    if (difficulty) query = query.eq("difficulty", difficulty);
    if (category)   query = query.eq("category", category);

    const { data: rows, error } = await query;

    if (error) {
      console.error("question-bank GET error:", error);
      return NextResponse.json({ error: "Failed to fetch question bank" }, { status: 500 });
    }

    const items: QuestionBankItem[] = (rows ?? []).map((row) => ({
      id:          row.id as string,
      title:       row.title as string,
      category:    row.category as string,
      difficulty:  row.difficulty as "easy" | "medium" | "hard",
      prompt:      row.prompt as string,
      starterCode: (row.starter_code ?? {}) as Record<string, string>,
      testCases:   (row.test_cases ?? []) as { input: string; expectedOutput: string }[],
      tags:        (row.tags ?? []) as string[],
    }));

    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("question-bank GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
