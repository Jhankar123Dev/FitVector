/**
 * seeker/onboarding/resume-parse-error.spec.ts
 *
 * Verifies the negative paths through /api/ai/parse-resume — the endpoint
 * that the onboarding Step 4 file picker hits.
 *
 * Verified against src/app/api/ai/parse-resume/route.ts:
 *   - 401 if not authenticated
 *   - 400 "No file provided"            when the multipart 'file' is missing
 *   - 400 "Invalid file type. …"        for anything other than PDF or DOCX
 *   - 400 "File too large. Maximum 5MB" when file.size > 5MB
 *   - 500 "Failed to parse resume…"     when the Python service errors out
 *
 * The Python-service-down path runs server-side, so we can't intercept it
 * from the test client; that test is fixme'd until we have a way to inject
 * a Python failure (e.g. an env-flag toggle in the route).
 *
 * Coverage (3 tests):
 *   ❌ oversize PDF (>5MB)            → 400 "File too large"
 *   ❌ wrong MIME type (text/plain)   → 400 "Invalid file type"
 *   ❌ multipart body without 'file'  → 400 "No file provided"
 *   ⚠ test.fixme — Python service 503 fallback (server-side only)
 */

import { test, expect } from "../../support/fixtures";
import { signInAs } from "../../support/helpers/auth";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("/api/ai/parse-resume — error paths", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("oversize PDF (>5MB) is rejected with 400 'File too large'", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    // 6MB of zero bytes with a PDF magic header so type detection passes.
    const pdfHeader = Buffer.from("%PDF-1.4\n");
    const padding = Buffer.alloc(6 * 1024 * 1024 - pdfHeader.length);
    const oversize = Buffer.concat([pdfHeader, padding]);

    const res = await page.request.post(`${BASE_URL}/api/ai/parse-resume`, {
      multipart: {
        file: {
          name: "huge.pdf",
          mimeType: "application/pdf",
          buffer: oversize,
        },
      },
    });
    expect(res.status()).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/file too large/i);
  });

  test("non-PDF/non-DOCX upload is rejected with 400 'Invalid file type'", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    const res = await page.request.post(`${BASE_URL}/api/ai/parse-resume`, {
      multipart: {
        file: {
          name: "notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("just a plain text file, not a resume"),
        },
      },
    });
    expect(res.status()).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/invalid file type/i);
  });

  test("multipart body with no 'file' field is rejected with 400 'No file provided'", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    const res = await page.request.post(`${BASE_URL}/api/ai/parse-resume`, {
      // multipart without a `file` part — the route reads formData.get("file")
      // which returns null and short-circuits with the 'No file provided' error.
      multipart: {
        notTheFileField: "irrelevant",
      },
    });
    expect(res.status()).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/no file provided/i);
  });

  test.fixme(
    "Python parse service 503/error → 500 'Failed to parse resume' (BLOCKED: server-side fetch can't be mocked from the test client; TODO add env toggle in /api/ai/parse-resume that forces a failure for tests)",
    async () => {
      // Wire up once a PYTHON_PARSE_FORCE_ERROR=true env hook lands in the
      // route; the test will then upload a tiny valid PDF and assert 500 +
      // the user-facing 'Failed to parse resume' copy.
    },
  );
});
