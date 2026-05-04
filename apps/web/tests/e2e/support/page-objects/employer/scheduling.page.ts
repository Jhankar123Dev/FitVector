/**
 * support/page-objects/employer/scheduling.page.ts
 *
 * Page object for /employer/scheduling — weekly calendar view of human
 * interviews with reschedule + feedback.
 */

import type { Page, Locator } from "@playwright/test";

export type InterviewType = "phone" | "video" | "onsite";

export class SchedulingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/employer/scheduling");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Header / nav ──────────────────────────────────────────────────────────

  get heading(): Locator {
    return this.page.getByRole("heading", { name: /interview scheduling/i });
  }

  get prevWeekButton(): Locator {
    return this.page.getByRole("button", { name: /previous week|prev/i });
  }

  get nextWeekButton(): Locator {
    return this.page.getByRole("button", { name: /next week/i });
  }

  // ── Calendar grid ─────────────────────────────────────────────────────────

  dayColumn(index: number): Locator {
    return this.page.getByTestId(`calendar-day-${index}`);
  }

  timeSlot(day: number, hour: number): Locator {
    return this.page.getByTestId(`calendar-slot-${day}-${hour}`);
  }

  interviewBlockByCandidate(name: string): Locator {
    return this.page.getByTestId("interview-block").filter({ hasText: name });
  }

  // ── Schedule / reschedule dialog ──────────────────────────────────────────

  get scheduleDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /schedule interview/i });
  }

  get candidateSelect(): Locator {
    return this.scheduleDialog.getByRole("combobox", { name: /candidate/i });
  }

  get interviewerSelect(): Locator {
    return this.scheduleDialog.getByRole("combobox", { name: /interviewer/i });
  }

  interviewTypeOption(type: InterviewType): Locator {
    return this.scheduleDialog.getByRole("radio", { name: new RegExp(type, "i") });
  }

  get saveScheduleButton(): Locator {
    return this.scheduleDialog.getByRole("button", { name: /save|schedule/i });
  }

  // ── Feedback dialog ───────────────────────────────────────────────────────

  get feedbackDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /feedback/i });
  }

  get feedbackNotesTextarea(): Locator {
    return this.feedbackDialog.getByLabel(/notes/i);
  }

  ratingButton(rating: 1 | 2 | 3 | 4 | 5): Locator {
    return this.feedbackDialog.getByRole("button", { name: new RegExp(`^${rating} star`, "i") });
  }

  get submitFeedbackButton(): Locator {
    return this.feedbackDialog.getByRole("button", { name: /submit feedback|save feedback/i });
  }
}
