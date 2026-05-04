/**
 * support/page-objects/employer/job-post.page.ts
 *
 * Page object covering /employer/jobs (list), /employer/jobs/create, and
 * /employer/jobs/[id]/edit.
 */

import type { Page, Locator } from "@playwright/test";

export type JobStatus = "draft" | "active" | "closed";

export class JobPostPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async gotoList(): Promise<void> {
    await this.page.goto("/employer/jobs");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoCreate(): Promise<void> {
    await this.page.goto("/employer/jobs/create");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoEdit(jobId: string): Promise<void> {
    await this.page.goto(`/employer/jobs/${jobId}/edit`);
    await this.page.waitForLoadState("networkidle");
  }

  // ── List view ────────────────────────────────────────────────────────────

  get listHeading(): Locator {
    return this.page.getByRole("heading", { name: /jobs/i });
  }

  get createJobButton(): Locator {
    return this.page.getByRole("link", { name: /create job|post a job|\+ new job/i });
  }

  statusFilter(status: JobStatus | "all"): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${status}$`, "i") });
  }

  jobRowByTitle(title: string): Locator {
    return this.page.getByRole("row").filter({ hasText: title });
  }

  // ── Create / edit form ────────────────────────────────────────────────────

  get titleInput(): Locator {
    return this.page.getByLabel(/job title/i);
  }

  get departmentInput(): Locator {
    return this.page.getByLabel(/department/i);
  }

  get locationInput(): Locator {
    return this.page.getByLabel(/location/i);
  }

  get descriptionTextarea(): Locator {
    return this.page.getByLabel(/description/i);
  }

  get workModeSelect(): Locator {
    return this.page.getByRole("combobox", { name: /work mode/i });
  }

  get jobTypeSelect(): Locator {
    return this.page.getByRole("combobox", { name: /job type/i });
  }

  get salaryMinInput(): Locator {
    return this.page.getByLabel(/salary.*min/i);
  }

  get salaryMaxInput(): Locator {
    return this.page.getByLabel(/salary.*max/i);
  }

  get aiAssistButton(): Locator {
    return this.page.getByRole("button", { name: /ai assist|generate description/i });
  }

  get saveDraftButton(): Locator {
    return this.page.getByRole("button", { name: /save (as )?draft/i });
  }

  get publishButton(): Locator {
    return this.page.getByRole("button", { name: /^publish$/i });
  }

  get unpublishButton(): Locator {
    return this.page.getByRole("button", { name: /unpublish|close job/i });
  }

  get duplicateButton(): Locator {
    return this.page.getByRole("button", { name: /duplicate/i });
  }

  get deleteButton(): Locator {
    return this.page.getByRole("button", { name: /^delete$/i });
  }

  // ── Confirm dialogs ───────────────────────────────────────────────────────

  get confirmDeleteDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /delete this job/i });
  }

  get confirmDeleteButton(): Locator {
    return this.confirmDeleteDialog.getByRole("button", { name: /delete/i });
  }
}
