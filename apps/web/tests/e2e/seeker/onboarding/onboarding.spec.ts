/**
 * seeker/onboarding/onboarding.spec.ts
 *
 * E2E tests for the 4-step Job Seeker Onboarding wizard at /onboarding.
 *
 * Auth: pre-loaded from tests/e2e/.auth/seeker.json (built by
 * setup/seeker.setup.ts) so every test starts authenticated as
 * playwright@gmail.com.
 *
 * Externals are mocked via support/fixtures/mock-fixture.ts so this spec
 * is fully deterministic regardless of Python service / AI provider state.
 *
 * Coverage:
 *   ✅ happy path  — all four steps, resume upload, redirect to /dashboard
 *   ✅ validation  — required-field errors on Steps 1, 2, and 3
 */

import { test, expect } from "../../support/fixtures";
import { OnboardingPage } from "../../support/page-objects/seeker/onboarding.page";
import { mockAi } from "../../support/fixtures/mock-fixture";
import { MINIMAL_PDF_BUFFER } from "../../support/mocks/ai-responses";

test.describe("Seeker Onboarding Wizard", () => {
  test("happy path: fills all steps, uploads a resume, and lands on the dashboard", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    // ── Step 1 — Current Status ──────────────────────────────────────────
    await expect(onboarding.step1Heading).toBeVisible();
    await onboarding.selectLookingForWork();
    await onboarding.fillCurrentRole("Software Developer");
    await onboarding.continueButton.click();

    // ── Step 2 — Target Roles ────────────────────────────────────────────
    await expect(onboarding.step2Heading).toBeVisible();
    await expect(page.getByText("What are you looking for?")).toBeVisible();
    await onboarding.addTargetRole("Frontend Developer");
    await expect(page.getByText("Frontend Developer")).toBeVisible();
    await onboarding.continueButton.click();

    // ── Step 3 — Preferences ─────────────────────────────────────────────
    await expect(onboarding.step3Heading).toBeVisible();
    await expect(page.getByText("Location & work style")).toBeVisible();
    await onboarding.addLocation("Bangalore");
    await expect(page.getByText("Bangalore")).toBeVisible();
    await onboarding.continueButton.click();

    // ── Step 4 — Resume Upload ───────────────────────────────────────────
    await expect(onboarding.step4Heading).toBeVisible();

    // Mock parse + onboarding-completion endpoints BEFORE the upload fires.
    await mockAi(page, { parseResume: true, onboardingComplete: true });

    await onboarding.uploadResume(MINIMAL_PDF_BUFFER);

    await expect(onboarding.parseSuccessBanner).toBeVisible({ timeout: 15_000 });

    // Spot-check that extracted skills from the mock payload render.
    await expect(page.getByText("JavaScript")).toBeVisible();
    await expect(page.getByText("TypeScript")).toBeVisible();

    // ── Complete setup → redirect to /dashboard ──────────────────────────
    await onboarding.completeSetupButton.click();
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("validation: shows inline errors when required fields are skipped", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    // ── Step 1 — currentRole is required ─────────────────────────────────
    await expect(onboarding.step1Heading).toBeVisible();
    await onboarding.continueButton.click();
    await expect(onboarding.currentRoleRequiredError).toBeVisible();

    // Fill role to clear the error and advance to Step 2.
    await onboarding.fillCurrentRole("QA Analyst");
    await onboarding.continueButton.click();

    // ── Step 2 — at least one target role required ───────────────────────
    await expect(onboarding.step2Heading).toBeVisible();
    await onboarding.continueButton.click();
    await expect(onboarding.targetRoleRequiredError).toBeVisible();

    await onboarding.addTargetRole("Backend Developer");
    await expect(page.getByText("Backend Developer")).toBeVisible();
    await onboarding.continueButton.click();

    // ── Step 3 — at least one location required ──────────────────────────
    await expect(onboarding.step3Heading).toBeVisible();
    await onboarding.continueButton.click();
    await expect(onboarding.locationRequiredError).toBeVisible();

    // Confirm we did NOT advance to Step 4.
    await expect(page.getByText("Location & work style")).toBeVisible();
  });
});
