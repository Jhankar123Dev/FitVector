/**
 * support/mocks/code-execute.ts
 *
 * Mock responses for POST /api/code/execute — the JDoodle-backed code-runner
 * used inside assessment-take flows.
 *
 * Contract per route.ts: server returns ONLY visible test-case results,
 * never the full hidden test suite. `expectedOutput` must NEVER appear in
 * mocked responses (security parity with production).
 */

export const MOCK_CODE_EXECUTE_ALL_PASSED = {
  data: {
    results: [
      { input: "[1,2,3]", actualOutput: "[3,2,1]", passed: true },
      { input: "[]", actualOutput: "[]", passed: true },
    ],
    passedCount: 2,
    totalCount: 2,
    allPassed: true,
  },
} as const;

export const MOCK_CODE_EXECUTE_SOME_FAILED = {
  data: {
    results: [
      { input: "[1,2,3]", actualOutput: "[3,2,1]", passed: true },
      { input: "[]", actualOutput: "[1]", passed: false },
    ],
    passedCount: 1,
    totalCount: 2,
    allPassed: false,
  },
} as const;

export const MOCK_CODE_EXECUTE_RUNTIME_ERROR = {
  data: {
    results: [
      {
        input: "[1,2,3]",
        actualOutput: null,
        passed: false,
        error: "TypeError: Cannot read property 'next' of undefined",
      },
    ],
    passedCount: 0,
    totalCount: 1,
    allPassed: false,
  },
} as const;

export const MOCK_CODE_EXECUTE_UNSUPPORTED_LANGUAGE_ERROR = {
  error: "Unsupported language: rust",
} as const;

export const MOCK_CODE_EXECUTE_INVALID_TOKEN_ERROR = {
  error: "Invalid or expired assessment session",
} as const;

export const MOCK_CODE_EXECUTE_SERVICE_UNAVAILABLE_ERROR = {
  error: "Code execution service not configured",
} as const;
