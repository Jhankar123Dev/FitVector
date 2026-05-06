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

// ── Node.js async test harness injection ─────────────────────────────────────
//
// Problem: candidates write `module.exports = fn` style code (standard for
// algorithm questions). When sent to JDoodle as-is, the script produces no
// stdout — the function is exported but never called.
//
// Fix: detect timing-based test patterns and inject an async harness that:
//   1. Captures the exported function
//   2. Calls it with the right args / timing
//   3. Waits for async operations (setTimeout) to complete
//   4. Prints the result so JDoodle has something to compare
//
// Supported patterns (case-insensitive input strings):
//   "called Nx in Xms with Xms delay"   → debounce test
//   "called Nx every Xms with Xms wait" → throttle test

function injectNodeJsHarness(code: string, input: string): string {
  // Only apply to code that uses the module.exports export pattern.
  if (!code.includes("module.exports")) return code;

  // ── Debounce pattern ─────────────────────────────────────────────────────
  // e.g. "called 3x in 100ms with 200ms delay"
  const debounceMatch = input.match(
    /called\s+(\d+)x?\s+in\s+(\d+)\s*ms?\s+with\s+(\d+)\s*ms?\s+delay/i,
  );
  if (debounceMatch) {
    const callCount = parseInt(debounceMatch[1], 10);
    const windowMs  = parseInt(debounceMatch[2], 10);
    const delayMs   = parseInt(debounceMatch[3], 10);
    const gapMs     = Math.floor(windowMs / callCount);

    return `${code}

// ─── Auto-injected async test harness ───────────────────────────────────────
// Wraps the exported debounce function, calls it ${callCount}x over ${windowMs}ms,
// then waits ${delayMs}ms for the trailing call to fire and prints the result.
(async function _harnessDebounce() {
  const exported = module.exports;
  if (typeof exported !== "function") {
    console.log("ERROR: expected module.exports to be a function");
    return;
  }

  const calls = [];
  const debounced = exported(function (...args) { calls.push(args[0]); }, ${delayMs});

  for (let i = 1; i <= ${callCount}; i++) {
    debounced(i);
    if (i < ${callCount}) {
      await new Promise((r) => setTimeout(r, ${gapMs}));
    }
  }

  // Wait for the debounce delay + a small buffer to ensure the timer fires.
  await new Promise((r) => setTimeout(r, ${delayMs} + 100));

  // Output: number of times fn was actually called (should be 1),
  // followed by the argument from the final invocation.
  console.log(calls.length);       // line 1: call count (expect 1)
  if (calls.length > 0) {
    console.log(calls[calls.length - 1]); // line 2: last arg (expect ${callCount})
  }
})();
`;
  }

  // ── Throttle pattern ─────────────────────────────────────────────────────
  // e.g. "called 5x every 100ms with 300ms wait"
  const throttleMatch = input.match(
    /called\s+(\d+)x?\s+every\s+(\d+)\s*ms?\s+with\s+(\d+)\s*ms?\s+wait/i,
  );
  if (throttleMatch) {
    const callCount = parseInt(throttleMatch[1], 10);
    const intervalMs = parseInt(throttleMatch[2], 10);
    const limitMs    = parseInt(throttleMatch[3], 10);

    return `${code}

// ─── Auto-injected async test harness ───────────────────────────────────────
(async function _harnessThrottle() {
  const exported = module.exports;
  if (typeof exported !== "function") {
    console.log("ERROR: expected module.exports to be a function");
    return;
  }

  const calls = [];
  const throttled = exported(function (...args) { calls.push(args[0]); }, ${limitMs});

  for (let i = 1; i <= ${callCount}; i++) {
    throttled(i);
    await new Promise((r) => setTimeout(r, ${intervalMs}));
  }

  await new Promise((r) => setTimeout(r, ${limitMs} + 100));

  console.log(calls.length);
  calls.forEach((c) => console.log(c));
})();
`;
  }

  // No timing pattern recognised — return the code unchanged.
  // (Simple algorithm questions with stdin/stdout work fine without a harness.)
  return code;
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
      // For Node.js, inject an async test harness when the test case describes
      // a timing-based scenario (debounce / throttle). This ensures the exported
      // function is actually called and its async result is printed to stdout.
      const script =
        langKey === "nodejs"
          ? injectNodeJsHarness(code, tc.input)
          : code;

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 55_000); // 55 s per test case

      // Use Node's https.request directly so we can pass the custom agent
      // (global fetch in Node.js 18 does not expose an agent option)
      const payload = JSON.stringify({
        clientId,
        clientSecret,
        script,
        language:     langConfig.language,
        versionIndex: langConfig.versionIndex,
        stdin:        tc.input,
      });

      const rawBody = await new Promise<string>((resolve, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("Request timed out")));
        const req = https.request(
          JDOODLE_URL,
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
