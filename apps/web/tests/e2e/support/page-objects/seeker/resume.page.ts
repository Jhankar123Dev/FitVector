/**
 * support/page-objects/seeker/resume.page.ts
 *
 * Page object for /dashboard/resume.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/resume/page.tsx
 *   - src/components/resume/version-list.tsx
 *   - src/components/resume/tailor-dialog.tsx (rendered INSIDE /dashboard/jobs,
 *     not on this page — the resume page is read-only versions list).
 *
 * Reality vs MASTER_PLAN:
 *   - There is NO "New Tailored Resume" button on /dashboard/resume. Tailoring
 *     is initiated from the jobs board: a job card → JobDetail → "Tailor
 *     Resume" → opens TailorDialog inline. The resume page only lists what's
 *     already been generated.
 *   - There is NO inline editor for the parsed-resume preview. The "View"
 *     button on the BaseResumeUpload card toggles a read-only summary
 *     (name/email/skills/experience-count/education-count). To actually edit
 *     parsed fields the user goes to /dashboard/settings (already covered by
 *     W3a profile specs).
 */

import type { Page, Locator } from "@playwright/test";

export class ResumePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard/resume");
    await this.page.getByRole("heading", { level: 1, name: /resume versions/i }).waitFor();
  }

  // ── Base-resume upload card ───────────────────────────────────────────────

  get baseResumeCard(): Locator {
    return this.page.getByText("Base Resume").locator("..");
  }

  /** "Upload Resume" when no resume exists, "Replace Resume" otherwise. */
  get uploadButton(): Locator {
    return this.page.getByRole("button", { name: /(upload|replace) resume/i });
  }

  /** Toggles the parsed-data preview block. Visible only after a successful upload. */
  get viewParsedButton(): Locator {
    return this.page.getByRole("button", { name: /^view$/i });
  }

  get hideParsedButton(): Locator {
    return this.page.getByRole("button", { name: /^hide$/i });
  }

  /**
   * The hidden file input the click-handler delegates to. Use
   * setInputFiles() rather than clicking the visible button to avoid the
   * native file picker.
   */
  get fileInput(): Locator {
    return this.page.locator('input[type="file"]').first();
  }

  // ── Status indicators on the upload card ─────────────────────────────────

  get uploadingState(): Locator {
    return this.page.getByText(/uploading\.\.\./i);
  }

  /** "Resume uploaded and parsed successfully!" — green helper line. */
  get parseSuccessLine(): Locator {
    return this.page.getByText(/resume uploaded and parsed successfully/i);
  }

  /** Inline error from /api/ai/parse-resume failures (e.g. invalid type). */
  get parseErrorLine(): Locator {
    // Renders as <p class="text-red-600"> with the AlertCircle icon.
    return this.page.locator("p.text-red-600");
  }

  // ── Tailored versions list ───────────────────────────────────────────────

  /** "No tailored resumes yet" empty state. */
  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: /no tailored resumes yet/i });
  }

  /**
   * A version row keyed by its version_name. The card is a <Card> wrapping
   * an h3 with the name. Use the h3 + ancestor walk to scope downstream
   * locators (download button etc.) to that row.
   */
  versionRow(versionName: string): Locator {
    return this.page
      .locator("h3", { hasText: versionName })
      .locator("xpath=ancestor::div[contains(@class,'rounded-lg') or contains(@class,'rounded-xl')][1]");
  }

  /** The download (cloud icon) button inside a specific version row. */
  versionDownloadButton(versionName: string): Locator {
    return this.versionRow(versionName).getByRole("button", { name: /download/i });
  }

  versionViewLink(versionName: string): Locator {
    return this.versionRow(versionName).getByRole("link", { name: /^view$/i });
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async uploadFile(
    buffer: Buffer,
    opts: { name?: string; mimeType?: string } = {},
  ): Promise<void> {
    await this.fileInput.setInputFiles({
      name: opts.name ?? "resume.pdf",
      mimeType: opts.mimeType ?? "application/pdf",
      buffer,
    });
  }
}
