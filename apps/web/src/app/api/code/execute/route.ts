import { NextResponse } from "next/server";
import { z } from "zod";

const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";

// JDoodle language map — our key → { language, versionIndex }
const LANG_MAP: Record<string, { language: string; versionIndex: string }> = {
  python3:    { language: "python3",    versionIndex: "3" },
  nodejs:     { language: "nodejs",     versionIndex: "4" },
  java:       { language: "java",       versionIndex: "4" },
  cpp17:      { language: "cpp17",      versionIndex: "1" },
  go:         { language: "go",         versionIndex: "4" },
  typescript: { language: "typescript", versionIndex: "1" },
};

const executeSchema = z.object({
  code: z.string().min(1),
  language: z.string(),          // one of the LANG_MAP keys
  testCases: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
    }),
  ).min(1).max(10),
});

export type CodeExecuteResult = {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  cpuTime?: string;
  memory?: string;
  error?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { code, language, testCases } = parsed.data;

    const langConfig = LANG_MAP[language];
    if (!langConfig) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}. Supported: ${Object.keys(LANG_MAP).join(", ")}` },
        { status: 400 },
      );
    }

    const clientId     = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[code/execute] JDOODLE_CLIENT_ID / JDOODLE_CLIENT_SECRET not set");
      return NextResponse.json({ error: "Code execution not configured" }, { status: 503 });
    }

    // Run each test case sequentially (JDoodle free tier: 200 credits/day)
    const results: CodeExecuteResult[] = [];

    for (const tc of testCases) {
      try {
        const jdoodleRes = await fetch(JDOODLE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            clientSecret,
            script: code,
            language: langConfig.language,
            versionIndex: langConfig.versionIndex,
            stdin: tc.input,
          }),
        });

        if (!jdoodleRes.ok) {
          const errText = await jdoodleRes.text().catch(() => "unknown");
          console.error("[code/execute] JDoodle HTTP error:", jdoodleRes.status, errText);
          results.push({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: "",
            passed: false,
            error: `Execution service error (${jdoodleRes.status})`,
          });
          continue;
        }

        const data = await jdoodleRes.json() as {
          output?: string;
          statusCode?: number;
          memory?: string;
          cpuTime?: string;
          error?: string;
        };

        // JDoodle wraps runtime errors in output field (statusCode !== 200)
        const raw        = data.output ?? "";
        const actualOut  = raw.trimEnd();          // trim trailing newlines for comparison
        const expectedOut = tc.expectedOutput.trimEnd();
        const passed     = actualOut === expectedOut;

        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: raw,
          passed,
          cpuTime: data.cpuTime,
          memory: data.memory,
          error: data.statusCode !== 200 ? raw : undefined,
        });
      } catch (err) {
        console.error("[code/execute] test case error:", err);
        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: "",
          passed: false,
          error: "Execution timed out or failed",
        });
      }
    }

    const allPassed  = results.every((r) => r.passed);
    const passedCount = results.filter((r) => r.passed).length;

    return NextResponse.json({
      data: {
        results,
        allPassed,
        passedCount,
        totalCount: results.length,
      },
    });
  } catch (error) {
    console.error("[code/execute] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
