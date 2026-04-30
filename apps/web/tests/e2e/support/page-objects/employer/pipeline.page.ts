/**
 * support/page-objects/employer/pipeline.page.ts
 *
 * Page object for /employer/jobs/[id]/pipeline — the 10-stage kanban
 * view + candidate detail drawer.
 */

import type { Page, Locator } from "@playwright/test";

export type PipelineStage =
  | "applied"
  | "ai_screened"
  | "assessment_pending"
  | "assessment_completed"
  | "ai_interview_pending"
  | "ai_interviewed"
  | "human_interview"
  | "offer"
  | "hired"
  | "rejected";

export class PipelinePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(jobId: string): Promise<void> {
    await this.page.goto(`/employer/jobs/${jobId}/pipeline`);
    await this.page.waitForLoadState("networkidle");
  }

  // ── View toggle ───────────────────────────────────────────────────────────

  get kanbanViewButton(): Locator {
    return this.page.getByRole("button", { name: /kanban/i });
  }

  get tableViewButton(): Locator {
    return this.page.getByRole("button", { name: /^table$/i });
  }

  // ── Kanban columns ────────────────────────────────────────────────────────

  column(stage: PipelineStage): Locator {
    return this.page.getByTestId(`pipeline-column-${stage}`);
  }

  // ── Candidate cards ───────────────────────────────────────────────────────

  candidateCardByName(name: string): Locator {
    return this.page.getByTestId("candidate-card").filter({ hasText: name });
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  get aiScreenAllButton(): Locator {
    return this.page.getByRole("button", { name: /ai screen all/i });
  }

  get bulkAssessmentButton(): Locator {
    return this.page.getByRole("button", { name: /bulk assessment/i });
  }

  // ── Candidate drawer ──────────────────────────────────────────────────────

  get drawer(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /candidate/i });
  }

  get drawerNotesTextarea(): Locator {
    return this.drawer.getByLabel(/notes/i);
  }

  get drawerSaveNoteButton(): Locator {
    return this.drawer.getByRole("button", { name: /save note/i });
  }

  get drawerScreenButton(): Locator {
    return this.drawer.getByRole("button", { name: /^screen$|run ai screening/i });
  }

  get drawerRejectButton(): Locator {
    return this.drawer.getByRole("button", { name: /^reject$/i });
  }

  get drawerScheduleButton(): Locator {
    return this.drawer.getByRole("button", { name: /schedule interview/i });
  }

  // ── Confirm dialogs ───────────────────────────────────────────────────────

  get rejectConfirmDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /reject this candidate/i });
  }

  get rejectConfirmButton(): Locator {
    return this.rejectConfirmDialog.getByRole("button", { name: /reject/i });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async openCandidateDrawer(name: string): Promise<void> {
    await this.candidateCardByName(name).click();
    await this.drawer.waitFor();
  }
}
