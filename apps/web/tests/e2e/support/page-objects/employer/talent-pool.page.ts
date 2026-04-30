/**
 * support/page-objects/employer/talent-pool.page.ts
 *
 * Page object for /employer/talent-pool — saved candidates with skill
 * matching, tagging, and re-engagement.
 */

import type { Page, Locator } from "@playwright/test";

export class TalentPoolPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/employer/talent-pool");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Header ────────────────────────────────────────────────────────────────

  get heading(): Locator {
    return this.page.getByRole("heading", { name: /talent pool/i });
  }

  get countBadge(): Locator {
    return this.heading.locator("..").getByText(/^\d+$/);
  }

  // ── Find Matches panel ────────────────────────────────────────────────────

  get jobPostSelect(): Locator {
    return this.page.getByRole("combobox", { name: /job post/i });
  }

  get maxCandidatesInput(): Locator {
    return this.page.getByLabel(/max candidates/i);
  }

  get lastActiveAfterInput(): Locator {
    return this.page.getByLabel(/last active/i);
  }

  get skillsInput(): Locator {
    return this.page.getByPlaceholder(/e\.g\.\s*react|skills/i);
  }

  get locationInput(): Locator {
    return this.page.getByPlaceholder(/e\.g\.\s*bangalore|location/i);
  }

  get findMatchesButton(): Locator {
    return this.page.getByRole("button", { name: /find matches/i });
  }

  get matchResultsTable(): Locator {
    return this.page.getByTestId("match-results-table");
  }

  // ── Candidate list / filters ──────────────────────────────────────────────

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search.*name.*email|search candidates/i);
  }

  scoreFilter(filter: "all" | "80+" | "60-80" | "<60"): Locator {
    return this.page.getByRole("button", { name: new RegExp(filter, "i") });
  }

  get candidateRows(): Locator {
    return this.page.getByTestId("talent-pool-row");
  }

  candidateRowByName(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  addTagButton(forName: string): Locator {
    return this.candidateRowByName(forName).getByRole("button", { name: /\+ tag/ });
  }

  // ── Re-engage ─────────────────────────────────────────────────────────────

  reengageButton(forName: string): Locator {
    return this.candidateRowByName(forName).getByRole("button", { name: /re-engage|reach out/i });
  }

  get reengageDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /re-engage|reach out/i });
  }

  get reengageSubjectInput(): Locator {
    return this.reengageDialog.getByLabel(/subject/i);
  }

  get reengageMessageTextarea(): Locator {
    return this.reengageDialog.getByLabel(/message/i);
  }

  get sendReengageButton(): Locator {
    return this.reengageDialog.getByRole("button", { name: /send/i });
  }
}
