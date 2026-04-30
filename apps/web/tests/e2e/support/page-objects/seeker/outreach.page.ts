/**
 * support/page-objects/seeker/outreach.page.ts
 *
 * Page object for /dashboard/outreach.
 * Three plan-gated AI flows: cold-email, linkedin-msg, referral-msg.
 * Selectors based on the audit report — verify during W4 spec implementation.
 */

import type { Page, Locator } from "@playwright/test";

export type Tone = "professional" | "conversational" | "confident";
export type OutreachType = "cold_email" | "linkedin_message" | "referral_request";

export class OutreachPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard/outreach");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Header ────────────────────────────────────────────────────────────────

  get historyHeading(): Locator {
    return this.page.getByRole("heading", { name: /outreach history/i });
  }

  // ── Generation form ───────────────────────────────────────────────────────

  get jobTitleInput(): Locator {
    return this.page.getByLabel(/job title/i);
  }

  get companyNameInput(): Locator {
    return this.page.getByLabel(/company name/i);
  }

  get recruiterNameInput(): Locator {
    return this.page.getByLabel(/recruiter name/i);
  }

  toneButton(tone: Tone): Locator {
    return this.page.getByRole("button", { name: new RegExp(tone, "i") });
  }

  generateButton(type: OutreachType): Locator {
    const labels: Record<OutreachType, RegExp> = {
      cold_email: /generate cold email/i,
      linkedin_message: /generate linkedin/i,
      referral_request: /generate referral/i,
    };
    return this.page.getByRole("button", { name: labels[type] });
  }

  // ── Result panel ──────────────────────────────────────────────────────────

  get generatedSubject(): Locator {
    return this.page.getByTestId("generated-subject");
  }

  get generatedBody(): Locator {
    return this.page.getByTestId("generated-body");
  }

  get copyButton(): Locator {
    return this.page.getByRole("button", { name: /copy/i }).first();
  }

  // ── History list ──────────────────────────────────────────────────────────

  get historyItems(): Locator {
    return this.page.getByTestId("outreach-history-item");
  }

  get loadMoreButton(): Locator {
    return this.page.getByRole("button", { name: /load more/i });
  }

  get showOlderToggle(): Locator {
    return this.page.getByRole("button", { name: /show older|hide older/i });
  }

  deleteButtonForItem(index: number): Locator {
    return this.historyItems.nth(index).getByRole("button", { name: /delete/i });
  }

  // ── Quota / upgrade ──────────────────────────────────────────────────────

  get upgradeModal(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /upgrade/i });
  }

  get quotaExceededError(): Locator {
    return this.page.getByText(/monthly.*limit reached/i);
  }
}
