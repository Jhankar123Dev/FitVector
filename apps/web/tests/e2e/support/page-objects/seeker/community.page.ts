/**
 * support/page-objects/seeker/community.page.ts
 *
 * Page object covering the four community surfaces:
 *   /dashboard/community             — hub
 *   /dashboard/community/discussions — threaded discussions
 *   /dashboard/community/interviews  — interview-experience reports
 *   /dashboard/community/salaries    — static salary table
 */

import type { Page, Locator } from "@playwright/test";

export class CommunityPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async gotoHub(): Promise<void> {
    await this.page.goto("/dashboard/community");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoDiscussions(): Promise<void> {
    await this.page.goto("/dashboard/community/discussions");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoInterviews(): Promise<void> {
    await this.page.goto("/dashboard/community/interviews");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoSalaries(): Promise<void> {
    await this.page.goto("/dashboard/community/salaries");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Hub ───────────────────────────────────────────────────────────────────

  get hubHeading(): Locator {
    return this.page.getByRole("heading", { name: "Community" });
  }

  get betaBadge(): Locator {
    return this.page.getByText(/^beta$/i);
  }

  get discussionsCard(): Locator {
    return this.page.getByRole("link").filter({ hasText: /discussions/i });
  }

  get interviewsCard(): Locator {
    return this.page.getByRole("link").filter({ hasText: /interview experiences/i });
  }

  get salariesCard(): Locator {
    return this.page.getByRole("link").filter({ hasText: /salary insights/i });
  }

  // ── Discussions ───────────────────────────────────────────────────────────

  categoryFilter(category: "all" | "tech" | "career" | "salary" | "misc"): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${category}$`, "i") });
  }

  get sortDropdown(): Locator {
    return this.page.getByRole("combobox", { name: /sort/i });
  }

  get newDiscussionButton(): Locator {
    return this.page.getByRole("button", { name: /new discussion/i });
  }

  get threads(): Locator {
    return this.page.getByTestId("discussion-thread");
  }

  upvoteForThread(index: number): Locator {
    return this.threads.nth(index).getByRole("button", { name: /upvote/i });
  }

  downvoteForThread(index: number): Locator {
    return this.threads.nth(index).getByRole("button", { name: /downvote/i });
  }

  // ── Interview experiences ────────────────────────────────────────────────

  get companySearchInput(): Locator {
    return this.page.getByPlaceholder(/search by company/i);
  }

  get roleSearchInput(): Locator {
    return this.page.getByPlaceholder(/search by role/i);
  }

  difficultyFilter(level: "all" | "easy" | "medium" | "hard"): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${level}$`, "i") });
  }

  outcomeFilter(outcome: "all" | "rejected" | "in_progress" | "offer"): Locator {
    return this.page.getByRole("button", { name: new RegExp(outcome.replace("_", " "), "i") });
  }

  get shareExperienceButton(): Locator {
    return this.page.getByRole("button", { name: /share your experience/i });
  }

  get interviewCards(): Locator {
    return this.page.getByTestId("interview-experience-card");
  }

  // ── Salaries ──────────────────────────────────────────────────────────────

  get salaryTable(): Locator {
    return this.page.getByRole("table");
  }
}
