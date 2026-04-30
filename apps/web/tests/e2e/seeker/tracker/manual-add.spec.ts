/**
 * seeker/tracker/manual-add.spec.ts
 *
 * Drives the "Add manually" form on the Personal tracker tab.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/tracker/page.tsx — "Add manually" button
 *     is visible ONLY on the Personal tab. Form has Job Title* and Company*;
 *     Add button is disabled until both have non-empty trim()'d values.
 *   - src/app/api/tracker/route.ts::POST — checks active_applications quota,
 *     returns 429 with `upgrade: true` when exceeded; otherwise 201 with
 *     { id, alreadyExists }.
 *
 * Coverage (4 tests):
 *   ✅ "Add manually" button on Personal tab opens the inline form
 *   ✅ Add button is disabled until Job Title AND Company are non-empty
 *   ✅ submit POSTs /api/tracker with status="saved" and the typed values
 *   ❌ 429 quota response renders the inline UpgradePrompt
 */

import { test, expect } from "../../support/fixtures";
import type { Page, Request } from "@playwright/test";

async function mockEmptyTracker(page: Page): Promise<void> {
  await page.route("**/api/tracker**", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });
}

async function gotoPersonalTab(seekerPage: Page): Promise<void> {
  await seekerPage.goto("/dashboard/tracker");
  await seekerPage.getByRole("button", { name: /personal tracker/i }).click();
}

test.describe("Tracker — manual add", () => {
  test("'Add manually' button on Personal tab reveals the inline form", async ({
    seekerPage,
  }) => {
    await mockEmptyTracker(seekerPage);
    await gotoPersonalTab(seekerPage);

    // The "Add manually" button only appears on the Personal tab. Empty
    // state also offers an "Add your first application" CTA — either
    // surfaces the form. Click the header button.
    await seekerPage.getByRole("button", { name: /add manually/i }).click();

    await expect(seekerPage.getByLabel(/job title/i)).toBeVisible();
    await expect(seekerPage.getByLabel(/company/i)).toBeVisible();
    await expect(seekerPage.getByRole("button", { name: /^add$/i })).toBeVisible();
  });

  test("Add button is disabled until both Job Title and Company have values", async ({
    seekerPage,
  }) => {
    await mockEmptyTracker(seekerPage);
    await gotoPersonalTab(seekerPage);

    await seekerPage.getByRole("button", { name: /add manually/i }).click();
    const addBtn = seekerPage.getByRole("button", { name: /^add$/i });
    await expect(addBtn).toBeDisabled();

    await seekerPage.getByLabel(/job title/i).fill("Backend Engineer");
    // Still missing company — must remain disabled.
    await expect(addBtn).toBeDisabled();

    await seekerPage.getByLabel(/company/i).fill("Acme");
    await expect(addBtn).toBeEnabled();
  });

  test("submit POSTs /api/tracker with the typed values + status='saved'", async ({
    seekerPage,
  }) => {
    await mockEmptyTracker(seekerPage);

    const postRequests: Request[] = [];
    await seekerPage.route("**/api/tracker", async (route) => {
      if (route.request().method() === "POST") {
        postRequests.push(route.request());
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ data: { id: "new-app-1", alreadyExists: false } }),
        });
      } else {
        await route.fallback();
      }
    });

    await gotoPersonalTab(seekerPage);
    await seekerPage.getByRole("button", { name: /add manually/i }).click();
    await seekerPage.getByLabel(/job title/i).fill("Senior Engineer");
    await seekerPage.getByLabel(/company/i).fill("Globex");
    await seekerPage.getByRole("button", { name: /^add$/i }).click();

    await expect.poll(() => postRequests.length).toBeGreaterThan(0);
    const body = postRequests[0].postDataJSON() as Record<string, unknown>;
    expect(body.jobTitle).toBe("Senior Engineer");
    expect(body.companyName).toBe("Globex");
    expect(body.status).toBe("saved");
  });

  test("429 (active-applications quota) renders the inline upgrade prompt", async ({
    seekerPage,
  }) => {
    await mockEmptyTracker(seekerPage);
    await seekerPage.route("**/api/tracker", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Active application limit reached (10). Upgrade for more.",
            upgrade: true,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await gotoPersonalTab(seekerPage);
    await seekerPage.getByRole("button", { name: /add manually/i }).click();
    await seekerPage.getByLabel(/job title/i).fill("Engineer");
    await seekerPage.getByLabel(/company/i).fill("LimitCo");
    await seekerPage.getByRole("button", { name: /^add$/i }).click();

    // The page renders <UpgradePrompt message="Active application limit reached." />
    await expect(
      seekerPage.getByText(/active application limit reached/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
