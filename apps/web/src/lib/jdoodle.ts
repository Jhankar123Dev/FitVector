/**
 * JDoodle code execution utility — shared between:
 *  - /api/code/execute  (live "Run" during assessment)
 *  - /api/assessment/[token]/submit  (server-side grading on submission)
 *
 * Having one canonical implementation here ensures both call-sites use
 * identical execution logic and prevents drift between "preview" and
 * "graded" results.
 */

const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";

// ── Language map ──────────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  "python3",
  "nodejs",
  "java",
  "cpp17",
  "go",
  "typescript",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANG_MAP: Record<SupportedLanguage, { language: string; versionIndex: string }> = {
  python3:    { language: "python3",    versionIndex: "3" },
  nodejs:     { language: "nodejs",     versionIndex: "4" },
  java:       { language: "java",       versionIndex: "4" },
  cpp17:      { language: "cpp17",      versionIndex: "1" },
  go:         { language: "go",         versionIndex: "4" },
  typescript: { language: "typescript", versionIndex: "1" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface TestCaseResult {
  input:          string;
  expectedOutput: string;
  actualOutput:   string;
  passed:         boolean;
  cpuTime?:       string;
  memory?:        string;
  error?:         string;
}

export interface RunCodeResult {
  results:      TestCaseResult[];
  allPassed:    boolean;
  passedCount:  number;
  totalCount:   number;
}

// ── Core execution function ───────────────────────────────────────────────────

/**
 * Runs `code` against each test case in `testCases` via JDoodle and returns
 * pass/fail results for each.
 *
 * Throws if JDoodle credentials are not configured.
 * Individual test case failures are captured in the result (not thrown).
 */
export async function runCodeAgainstTestCases(
  code: string,
  language: string,
  testCases: TestCase[],
): Promise<RunCodeResult> {
  const clientId     = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("JDOODLE_CLIENT_ID / JDOODLE_CLIENT_SECRET not set");
  }

  const langKey = language as SupportedLanguage;
  const langConfig = LANG_MAP[langKey];

  if (!langConfig) {
    throw new Error(
      `Unsupported language: "${language}". Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
    );
  }

  const results: TestCaseResult[] = [];

  // Run each test case sequentially — JDoodle free tier: 200 credits/day.
  // Each test case = 1 credit.
  for (const tc of testCases) {
    try {
      const jdoodleRes = await fetch(JDOODLE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          clientId,
          clientSecret,
          script:       code,
          language:     langConfig.language,
          versionIndex: langConfig.versionIndex,
          stdin:        tc.input,
        }),
      });

      if (!jdoodleRes.ok) {
        const errText = await jdoodleRes.text().catch(() => "unknown");
        console.error("[jdoodle] HTTP error:", jdoodleRes.status, errText);
        results.push({
          input:          tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput:   "",
          passed:         false,
          error:          `Execution service error (${jdoodleRes.status})`,
        });
        continue;
      }

      const data = await jdoodleRes.json() as {
        output?:     string;
        statusCode?: number;
        memory?:     string;
        cpuTime?:    string;
        error?:      string;
      };

      // JDoodle wraps runtime errors in the output field (statusCode !== 200)
      const raw         = data.output ?? "";
      const actualOut   = raw.trimEnd();
      const expectedOut = tc.expectedOutput.trimEnd();
      const passed      = actualOut === expectedOut;

      results.push({
        input:          tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput:   raw,
        passed,
        cpuTime:        data.cpuTime,
        memory:         data.memory,
        error:          data.statusCode !== 200 ? raw : undefined,
      });
    } catch (err) {
      console.error("[jdoodle] test case error:", err);
      results.push({
        input:          tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput:   "",
        passed:         false,
        error:          "Execution timed out or failed",
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;

  return {
    results,
    allPassed:   passedCount === results.length,
    passedCount,
    totalCount:  results.length,
  };
}
