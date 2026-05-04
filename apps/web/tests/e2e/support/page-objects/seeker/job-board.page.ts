/**
 * support/page-objects/seeker/job-board.page.ts
 *
 * Page object for /dashboard/jobs (browse + search) and
 * /dashboard/jobs/[id] (detail).
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/jobs/page.tsx
 *   - src/components/jobs/job-card.tsx
 *   - src/components/jobs/job-detail.tsx
 *   - src/components/jobs/action-bar.tsx
 *   - src/components/jobs/job-list.tsx (infinite scroll via IntersectionObserver)
 *
 * Reality vs MASTER_PLAN:
 *   - The page renders an EmptyState ("Start your job search") on first load —
 *     there is NO browse-on-load list. A search must be triggered.
 *   - Pagination is INFINITE SCROLL, not numbered pages. The list mounts a
 *     sentinel <div /> at the bottom that auto-fires onLoadMore() once it
 *     scrolls into view.
 *   - The search input has placeholder "Job title... e.g. Frontend Developer"
 *     (not "Search jobs"). The location input has placeholder "City or Remote"
 *     and is NOT label-bound.
 *   - Apply button label is "Apply via FitVector" for FitVector jobs and a
 *     plain "Apply" anchor (target=_blank) for external jobs.
 *   - Save button toggles between "Save" and "Saved".
 */

import type { Page, Locator } from "@playwright/test";

export class JobBoardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard/jobs");
    await this.page.getByRole("heading", { level: 1, name: /^Job Search$/i }).waitFor();
  }

  async gotoDetail(jobId: string): Promise<void> {
    await this.page.goto(`/dashboard/jobs/${jobId}`);
  }

  // ── Search bar ───────────────────────────────────────────────────────────

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/job title/i);
  }

  get locationInput(): Locator {
    return this.page.getByPlaceholder(/city or remote/i);
  }

  get searchButton(): Locator {
    return this.page.getByRole("button", { name: /^Search$/ });
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────

  tab(label: "All Jobs" | "FitVector" | "External"): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${label}$`) });
  }

  // ── Filters (rendered by JobFiltersPanel) ────────────────────────────────

  get workModeFilter(): Locator {
    return this.page.getByLabel(/work mode/i);
  }

  get jobTypeFilter(): Locator {
    return this.page.getByLabel(/job type/i);
  }

  get hoursOldFilter(): Locator {
    return this.page.getByLabel(/posted within/i);
  }

  get salaryMinFilter(): Locator {
    return this.page.getByLabel(/min(?:imum)? salary/i);
  }

  get salaryMaxFilter(): Locator {
    return this.page.getByLabel(/max(?:imum)? salary/i);
  }

  get resetFiltersButton(): Locator {
    return this.page.getByRole("button", { name: /reset/i });
  }

  // ── Results ──────────────────────────────────────────────────────────────

  /** All rendered job cards. Each card root is the wrapping <Card> element. */
  get jobCards(): Locator {
    // job-card.tsx renders the card title in a truncated h3 — use that as
    // the most stable selector and walk up to the card root.
    return this.page.locator('div:has(> div > div > div > h3.truncate)');
  }

  /** Locate a card by its visible title text. */
  jobCardByTitle(title: string): Locator {
    return this.page.locator("h3", { hasText: title }).locator("xpath=ancestor::div[contains(@class,'cursor-pointer')]").first();
  }

  /** "X jobs found" status line above the list. */
  get resultsCount(): Locator {
    return this.page.getByText(/\d+\s+jobs?\s+found/i);
  }

  /** Loading spinner shown while infinite-scroll fetches the next page. */
  get loadMoreSpinner(): Locator {
    return this.page.locator(".animate-spin");
  }

  /** Empty / no-results EmptyState ("No jobs found") after a search. */
  get noJobsFound(): Locator {
    return this.page.getByRole("heading", { name: /no jobs found/i });
  }

  /** First-load EmptyState before any search is triggered. */
  get startSearchEmptyState(): Locator {
    return this.page.getByRole("heading", {
      name: /(start your job search|browse fitvector jobs)/i,
    });
  }

  // ── Detail panel (right side after card click, OR /dashboard/jobs/[id]) ──

  get detailHeading(): Locator {
    // The detail panel renders <h2> with the job title, not <h1>.
    return this.page.locator("h2");
  }

  get applyFitVectorButton(): Locator {
    return this.page.getByRole("button", { name: /apply via fitvector/i });
  }

  /** External-source jobs render an <a> "Apply" button instead. */
  get applyExternalLink(): Locator {
    return this.page.getByRole("link", { name: /^Apply$/ });
  }

  get appliedBadge(): Locator {
    return this.page.getByText(/^Applied$/, { exact: true });
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /^save$/i });
  }

  get savedButton(): Locator {
    return this.page.getByRole("button", { name: /^saved$/i });
  }

  // ── Apply modal ──────────────────────────────────────────────────────────

  get applyModalSubmitButton(): Locator {
    return this.page.getByRole("button", { name: /submit application/i });
  }

  applyModalResumeOption(versionName: string): Locator {
    // Resume options render as labelled tiles inside the modal.
    return this.page.getByText(versionName, { exact: false }).first();
  }
}
