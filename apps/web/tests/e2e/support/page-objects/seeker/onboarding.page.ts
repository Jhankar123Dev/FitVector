/**
 * support/page-objects/seeker/onboarding.page.ts
 *
 * Page object for the 4-step seeker onboarding wizard at /onboarding.
 * Selectors verified against the existing passing spec at
 * tests/e2e/seeker/onboarding/onboarding.spec.ts.
 */

import type { Page, Locator } from "@playwright/test";

export class OnboardingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/onboarding");
    await this.page.getByText("Current Status").waitFor();
  }

  // ── Step locators ─────────────────────────────────────────────────────────

  get step1Heading(): Locator {
    return this.page.getByText("Tell us about yourself");
  }

  get step2Heading(): Locator {
    return this.page.getByText("Target Roles");
  }

  get step3Heading(): Locator {
    return this.page.getByText("Preferences");
  }

  get step4Heading(): Locator {
    return this.page.getByRole("heading", { name: "Resume", exact: true });
  }

  get continueButton(): Locator {
    return this.page.getByRole("button", { name: "Continue" });
  }

  get completeSetupButton(): Locator {
    return this.page.getByRole("button", { name: "Complete Setup" });
  }

  get fileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  // ── Step 1 actions ────────────────────────────────────────────────────────

  async selectLookingForWork(): Promise<void> {
    await this.page.getByRole("button", { name: /Looking for Work/i }).click();
  }

  async selectCurrentlyWorking(): Promise<void> {
    await this.page.getByRole("button", { name: /Currently Working/i }).click();
  }

  async fillCurrentRole(role: string): Promise<void> {
    await this.page.getByLabel(/Current Role|Field of Study/i).fill(role);
  }

  // ── Step 2 actions ────────────────────────────────────────────────────────

  async addTargetRole(role: string): Promise<void> {
    await this.page.getByRole("button", { name: role }).click();
  }

  // ── Step 3 actions ────────────────────────────────────────────────────────

  async addLocation(location: string): Promise<void> {
    await this.page.getByRole("button", { name: location }).click();
  }

  // ── Step 4 actions ────────────────────────────────────────────────────────

  async uploadResume(buffer: Buffer, filename = "test-resume.pdf"): Promise<void> {
    await this.fileInput.setInputFiles({
      name: filename,
      mimeType: "application/pdf",
      buffer,
    });
  }

  get parseSuccessBanner(): Locator {
    return this.page.getByText("Resume parsed successfully!");
  }

  // ── Validation messages ───────────────────────────────────────────────────

  get currentRoleRequiredError(): Locator {
    return this.page.getByText("Current role is required");
  }

  get targetRoleRequiredError(): Locator {
    return this.page.getByText("Add at least one target role");
  }

  get locationRequiredError(): Locator {
    return this.page.getByText("Add at least one location");
  }
}
