/**
 * support/page-objects/seeker/tracker.page.ts
 *
 * Page object for /dashboard/tracker.
 * Two tabs: "Applied via FitVector" + "Personal Tracker" (kanban).
 * The personal tracker is plan-gated on `active_applications`.
 */

import type { Page, Locator } from "@playwright/test";

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export class TrackerPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard/tracker");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  get appliedTab(): Locator {
    return this.page.getByRole("tab", { name: /applied via fitvector/i });
  }

  get personalTab(): Locator {
    return this.page.getByRole("tab", { name: /personal tracker/i });
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search by company/i);
  }

  get statusFilter(): Locator {
    return this.page.getByRole("combobox", { name: /status/i });
  }

  get dateRangeFilter(): Locator {
    return this.page.getByRole("combobox", { name: /date range/i });
  }

  // ── Kanban columns (Personal Tracker) ─────────────────────────────────────

  kanbanColumn(status: ApplicationStatus): Locator {
    return this.page.getByTestId(`kanban-column-${status}`);
  }

  kanbanCardByCompany(companyName: string): Locator {
    return this.page.getByTestId("kanban-card").filter({ hasText: companyName });
  }

  // ── Add manual application ────────────────────────────────────────────────

  get addManuallyButton(): Locator {
    return this.page.getByRole("button", { name: /add manually|\+ add/i });
  }

  get addApplicationDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /add application/i });
  }

  get jobTitleInput(): Locator {
    return this.page.getByLabel(/job title/i);
  }

  get companyNameInput(): Locator {
    return this.page.getByLabel(/company name/i);
  }

  get saveApplicationButton(): Locator {
    return this.page.getByRole("button", { name: /^save|^add$/i });
  }

  // ── Plan-gating ──────────────────────────────────────────────────────────

  get upgradePrompt(): Locator {
    return this.page.getByText(/active application limit reached/i);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async addManualApplication(opts: { jobTitle: string; companyName: string }): Promise<void> {
    await this.addManuallyButton.click();
    await this.jobTitleInput.fill(opts.jobTitle);
    await this.companyNameInput.fill(opts.companyName);
    await this.saveApplicationButton.click();
  }
}
