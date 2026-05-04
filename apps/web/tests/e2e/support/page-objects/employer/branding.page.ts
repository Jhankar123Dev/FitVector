/**
 * support/page-objects/employer/branding.page.ts
 *
 * Page object for /employer/branding.
 *
 * RBAC: PUT /api/employer/branding requires `admin` or `recruiter` role
 * (verified via code-review-graph). hiring_manager and viewer get 403.
 */

import type { Page, Locator } from "@playwright/test";

export class BrandingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/employer/branding");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  get editTab(): Locator {
    return this.page.getByRole("tab", { name: /^edit$/i });
  }

  get previewTab(): Locator {
    return this.page.getByRole("tab", { name: /^preview$/i });
  }

  // ── Stat cards ────────────────────────────────────────────────────────────

  get profileViewsCard(): Locator {
    return this.page.getByText(/profile views/i);
  }

  get followersCard(): Locator {
    return this.page.getByText(/followers/i);
  }

  get applicationRateCard(): Locator {
    return this.page.getByText(/application rate/i);
  }

  // ── Edit tab fields ───────────────────────────────────────────────────────

  get bannerUploadButton(): Locator {
    return this.page.getByRole("button", { name: /upload banner|change banner/i });
  }

  get bannerFileInput(): Locator {
    return this.page.locator('input[type="file"]').first();
  }

  get companyStoryTextarea(): Locator {
    return this.page.getByLabel(/company story/i);
  }

  // ── Benefits ──────────────────────────────────────────────────────────────

  get benefitInput(): Locator {
    return this.page.getByPlaceholder(/add a benefit/i);
  }

  get addBenefitButton(): Locator {
    return this.page.getByRole("button", { name: /\+|add benefit/i });
  }

  benefitBadge(label: string): Locator {
    return this.page.getByRole("listitem").filter({ hasText: label });
  }

  // ── Culture values ────────────────────────────────────────────────────────

  cultureValueByIndex(index: number): Locator {
    return this.page.getByTestId("culture-value").nth(index);
  }

  // ── Day in the life ───────────────────────────────────────────────────────

  get addDayInLifeButton(): Locator {
    return this.page.getByRole("button", { name: /add for another role/i });
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /save all changes|^save$/i });
  }

  get savedConfirmation(): Locator {
    return this.page.getByText(/branding saved|saved successfully/i);
  }

  // ── RBAC error ────────────────────────────────────────────────────────────

  get forbiddenToast(): Locator {
    return this.page.getByText(/insufficient role|forbidden/i);
  }
}
