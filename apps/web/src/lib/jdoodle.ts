/**
 * JDoodle code execution utility — shared between:
 *  - /api/code/execute  (live "Run" during assessment)
 *  - /api/assessment/[token]/submit  (server-side grading on submission)
 *
 * Having one canonical implementation here ensures both call-sites use
 * identical execution logic and prevents drift between "preview" and
 * "graded" results.
 */

import https from "https";

const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";

// Node.js on Windows does not use the OS certificate store, so it may fail
// to verify JDoodle's TLS certificate. We create a scoped agent that bypasses
// verification ONLY for JDoodle calls — Supabase and all other requests are unaffected.
const jdoodleAgent = new https.Agent({ rejectUnauthorized: false });

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

// Normalise aliases → canonical JDoodle key
// Covers values stored by the assessment create page ("c++", "javascript", "python")
// as well as Monaco editor display names
const LANG_ALIASES: Record<string, SupportedLanguage> = {
  "c++":        "cpp17",
  "cpp":        "cpp17",
  "cpp14":      "cpp17",
  "javascript": "nodejs",
  "js":         "nodejs",
  "python":     "python3",
  "py":         "python3",
  "ts":         "typescript",
};

export function normaliseLanguage(lang: string): SupportedLanguage {
  const lower = lang.toLowerCase();
  if (LANG_ALIASES[lower]) return LANG_ALIASES[lower];
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lower)) return lower as SupportedLanguage;
  return "nodejs"; // safe fallback
}

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

  const langKey = normaliseLanguage(language);
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
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 55_000); // 55 s per test case

      // Use Node's https.request directly so we can pass the custom agent
      // (global fetch in Node.js 18 does not expose an agent option)
      const payload = JSON.stringify({
        clientId,
        clientSecret,
        script:       code,
        language:     langConfig.language,
        versionIndex: langConfig.versionIndex,
        stdin:        tc.input,
      });

      const rawBody = await new Promise<string>((resolve, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("Request timed out")));
        const req = https.request(
          "https://api.jdoodle.com/v1/execute",
          { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }, agent: jdoodleAgent },
          (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => resolve(data));
          },
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
      });
      clearTimeout(timeoutId);

      // Shim a Response-like object so the rest of the code below is unchanged
      // Parse the response body
      let parsedBody: { output?: string; statusCode?: number; memory?: string; cpuTime?: string; error?: string };
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        results.push({ input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: "", passed: false, error: "Invalid response from execution service" });
        continue;
      }

      // JDoodle wraps runtime errors in the output field (statusCode !== 200)
      const raw         = parsedBody.output ?? "";
      const actualOut   = raw.trimEnd();
      const expectedOut = tc.expectedOutput.trimEnd();
      const passed      = actualOut === expectedOut;

      results.push({
        input:          tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput:   raw,
        passed,
        cpuTime:        parsedBody.cpuTime,
        memory:         parsedBody.memory,
        error:          parsedBody.statusCode !== 200 ? raw : undefined,
      });
    } catch (err) {
      const cause = (err as { cause?: unknown })?.cause;
      const msg = err instanceof Error ? err.message : String(err);
      const causeMsg = cause instanceof Error ? cause.message : cause ? String(cause) : "";
      console.error("[jdoodle] test case error:", msg, causeMsg ? `| cause: ${causeMsg}` : "");
      results.push({
        input:          tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput:   "",
        passed:         false,
        error:          msg.includes("abort") || msg.includes("timeout")
          ? "Execution timed out (> 55 s)"
          : `Execution failed: ${msg}`,
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
