/**
 * seeker/resume/upload-and-parse.spec.ts
 *
 * Drives the BaseResumeUpload card on /dashboard/resume.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/resume/page.tsx::BaseResumeUpload
 *   - src/app/api/ai/parse-resume/route.ts (auth, type validation, 5MB cap,
 *     proxy to Python /ai/parse-resume, persist parsed_resume_json)
 *
 * The negative-path API contract (oversize / invalid-type / no-file) is
 * already covered server-side by W3a's
 * seeker/onboarding/resume-parse-error.spec.ts. This file focuses on the
 * UI surface — what the user actually sees when upload succeeds vs fails —
 * with /api/ai/parse-resume mocked via page.route() so we don't need a
 * Python service running.
 *
 * Coverage (5 tests):
 *   ✅ upload card + (Upload | Replace) button render
 *   ✅ successful PDF upload fires POST /api/ai/parse-resume + success line renders
 *   ✅ View toggle shows parsed name/email/skills/experience/education
 *   ❌ non-PDF rejection from API surfaces in the inline error line
 *   ❌ oversize rejection from API surfaces in the inline error line
 */

import { test, expect } from "../../support/fixtures";
import { ResumePage } from "../../support/page-objects/seeker/resume.page";
import type { Page, Request } from "@playwright/test";

const TINY_PDF = Buffer.concat([
  Buffer.from("%PDF-1.4\n"),
  Buffer.from("placeholder body, doesn't matter — server is mocked"),
]);

interface ParseMockOptions {
  status?: number;
  body?: Record<string, unknown>;
}

async function mockParseResume(
  page: Page,
  opts: ParseMockOptions = {},
): Promise<{ requests: Request[] }> {
  const requests: Request[] = [];
  await page.route("**/api/ai/parse-resume", async (route) => {
    requests.push(route.request());
    await route.fulfill({
      status: opts.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(
        opts.body ?? {
          data: {
            parsed: {
              name: "Ada Lovelace",
              email: "ada@example.com",
              skills: ["Analytical Engine", "Bernoulli numbers"],
              experience: [{ company: "Babbage Co", title: "Mathematician" }],
              education: [{ school: "Royal Society", degree: "Self-taught" }],
            },
            rawResumeUrl: "https://example.com/resume.pdf",
          },
        },
      ),
    });
  });
  return { requests };
}

/** Mock /api/user/resumes so the version list is empty (keeps the page tidy). */
async function mockEmptyVersions(page: Page): Promise<void> {
  await page.route("**/api/user/resumes", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    }),
  );
}

test.describe("Resume — base resume upload UI", () => {
  test("upload card and primary action button render", async ({ seekerPage }) => {
    await mockEmptyVersions(seekerPage);
    const resume = new ResumePage(seekerPage);
    await resume.goto();

    await expect(seekerPage.getByText("Base Resume")).toBeVisible();
    await expect(resume.uploadButton).toBeVisible();
  });

  test("successful PDF upload fires POST /api/ai/parse-resume + success line renders", async ({
    seekerPage,
  }) => {
    const { requests } = await mockParseResume(seekerPage);
    await mockEmptyVersions(seekerPage);

    const resume = new ResumePage(seekerPage);
    await resume.goto();
    await resume.uploadFile(TINY_PDF);

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(requests[0].method()).toBe("POST");
    expect(requests[0].url()).toContain("/api/ai/parse-resume");
    // Multipart body is opaque from this side — confirm the request was a
    // multipart POST (Playwright sends formData under multipart/form-data).
    expect(requests[0].headers()["content-type"]).toMatch(/multipart\/form-data/);

    await expect(resume.parseSuccessLine).toBeVisible({ timeout: 10_000 });
  });

  test("View toggle reveals parsed fields after a successful upload", async ({
    seekerPage,
  }) => {
    await mockParseResume(seekerPage);
    // Note: BaseResumeUpload reads parsed data from `user.resume_data` (NOT
    // from the parse response), so the View toggle only renders when the
    // session already has resume_data. Mock /api/auth/session to inject it.
    await seekerPage.route("**/api/auth/session", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "11111111-1111-4111-8111-111111111111",
            email: "viewer@example.com",
            name: "Viewer",
            role: "seeker",
            planTier: "free",
            onboardingCompleted: true,
            companyId: null,
            // Non-standard, but BaseResumeUpload reads (user as any).resume_data.
            resume_data: {
              name: "Ada Lovelace",
              email: "ada@example.com",
              skills: ["Analytical Engine", "Calculus"],
              experience: [{}, {}],
              education: [{}],
            },
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }),
    );
    await mockEmptyVersions(seekerPage);

    const resume = new ResumePage(seekerPage);
    await resume.goto();

    await resume.viewParsedButton.click();
    await expect(seekerPage.getByText(/Name:/)).toBeVisible();
    await expect(seekerPage.getByText("Ada Lovelace")).toBeVisible();
    await expect(seekerPage.getByText(/Email:/)).toBeVisible();
    await expect(seekerPage.getByText(/Analytical Engine/)).toBeVisible();
    // Counts render: "Experience entries: 2" and "Education entries: 1".
    await expect(seekerPage.getByText(/Experience entries:\s*2/)).toBeVisible();
    await expect(seekerPage.getByText(/Education entries:\s*1/)).toBeVisible();
  });

  test("non-PDF rejection from the API surfaces in the inline error line", async ({
    seekerPage,
  }) => {
    await mockParseResume(seekerPage, {
      status: 400,
      body: { error: "Invalid file type. Please upload a PDF or DOCX file." },
    });
    await mockEmptyVersions(seekerPage);

    const resume = new ResumePage(seekerPage);
    await resume.goto();
    await resume.uploadFile(Buffer.from("not actually a pdf"), {
      name: "notes.txt",
      mimeType: "text/plain",
    });

    await expect(resume.parseErrorLine).toBeVisible({ timeout: 10_000 });
    await expect(resume.parseErrorLine).toContainText(/invalid file type/i);
    await expect(resume.parseSuccessLine).not.toBeVisible();
  });

  test("oversize rejection from the API surfaces in the inline error line", async ({
    seekerPage,
  }) => {
    await mockParseResume(seekerPage, {
      status: 400,
      body: { error: "File too large. Maximum size is 5MB." },
    });
    await mockEmptyVersions(seekerPage);

    const resume = new ResumePage(seekerPage);
    await resume.goto();
    // The actual byte-size doesn't matter — the API is mocked. We just need
    // to drive the upload handler.
    await resume.uploadFile(TINY_PDF);

    await expect(resume.parseErrorLine).toBeVisible({ timeout: 10_000 });
    await expect(resume.parseErrorLine).toContainText(/file too large/i);
  });
});
