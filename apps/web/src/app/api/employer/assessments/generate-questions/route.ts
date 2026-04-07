import { NextResponse } from "next/server";
import { getEmployerSession } from "@/lib/employer-auth";
import { z } from "zod";

const generateSchema = z.object({
  topic: z.string().min(3).max(200),
  questionType: z.enum(["multiple_choice", "short_answer", "code"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  count: z.number().int().min(1).max(20),
  codeLanguage: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";
    const aiRes = await fetch(`${aiEngineUrl}/ai/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      console.error("AI generate-questions error:", err);
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 502 });
    }

    const json = await aiRes.json();
    return NextResponse.json({ data: json.questions });
  } catch (error) {
    console.error("generate-questions route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
