/**
 * support/page-objects/admin/moderation.page.ts
 *
 * Page object for /admin/jobs (job moderation) and /admin/companies.
 * Selectors verified against apps/web/src/app/(admin)/admin/jobs/page.tsx
 * and admin/companies/page.tsx.
 */

import type { Page, Locator } from "@playwright/test";

export type JobSourceFilter =
  | ""
  | "direct"
  | "linkedin"
  | "indeed"
  | "naukri"
  | "glassdoor"
  | "seed";

export class AdminModerationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async gotoJobs(): Promise<void> {
    await this.page.goto("/admin/jobs");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoCompanies(): Promise<void> {
    await this.page.goto("/admin/companies");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Jobs page ─────────────────────────────────────────────────────────────

  get jobsHeading(): Locator {
    return this.page.getByRole("heading", { name: /jobs/i });
  }

  get jobsSearchInput(): Locator {
    return this.page.getByPlaceholder(/search/i).first();
  }

  sourceFilter(source: JobSourceFilter | "all"): Locator {
    const label = source === "" || source === "all" ? "all" : source;
    return this.page.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
  }

  get jobRows(): Locator {
    return this.page.getByRole("row");
  }

  jobRowByTitle(title: string): Locator {
    return this.page.getByRole("row").filter({ hasText: title });
  }

  // ── Add job ───────────────────────────────────────────────────────────────

  get addJobButton(): Locator {
    return this.page.getByRole("button", { name: /add job|\+ new/i });
  }

  get addJobDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /add job/i });
  }

  // ── Bulk upload ───────────────────────────────────────────────────────────

  get bulkUploadButton(): Locator {
    return this.page.getByRole("button", { name: /bulk upload|import/i });
  }

  get bulkUploadDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /bulk upload/i });
  }

  get bulkJsonTextarea(): Locator {
    return this.bulkUploadDialog.getByRole("textbox");
  }

  get bulkSubmitButton(): Locator {
    return this.bulkUploadDialog.getByRole("button", { name: /upload|submit/i });
  }

  // ── Flag / activate / delete actions ──────────────────────────────────────

  flagButtonForTitle(title: string): Locator {
    return this.jobRowByTitle(title).getByRole("button", { name: /flag/i });
  }

  toggleActiveForTitle(title: string): Locator {
    return this.jobRowByTitle(title).getByRole("button", { name: /activate|deactivate/i });
  }

  deleteButtonForTitle(title: string): Locator {
    return this.jobRowByTitle(title).getByRole("button", { name: /delete/i });
  }

  // ── Companies page ────────────────────────────────────────────────────────

  get companiesHeading(): Locator {
    return this.page.getByRole("heading", { name: /companies/i });
  }

  companyRowByName(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  verifyButtonForCompany(name: string): Locator {
    return this.companyRowByName(name).getByRole("button", { name: /verify/i });
  }

  revokeVerificationForCompany(name: string): Locator {
    return this.companyRowByName(name).getByRole("button", { name: /revoke/i });
  }

  // ── Toasts ────────────────────────────────────────────────────────────────

  get successToast(): Locator {
    return this.page.getByText(/successfully|saved|verified/i);
  }
}
