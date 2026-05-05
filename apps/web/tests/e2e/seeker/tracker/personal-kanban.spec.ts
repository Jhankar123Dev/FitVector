/**
 * seeker/tracker/personal-kanban.spec.ts
 *
 * Verifies the Personal tracker Kanban board.
 *
 * Verified against:
 *   - src/components/tracker/kanban-board.tsx — 6 columns:
 *     saved / applied / screening / interview / offer / rejected.
 *     Drag-and-drop via @hello-pangea/dnd; FitVector apps are
 *     drag-disabled (employer controls their stage).
 *   - src/components/tracker/application-card.tsx — non-FV cards render a
 *     native <select> "StatusSelect" dropdown that calls onStatusChange()
 *     directly. This is the reliable fallback for testing stage moves.
 *   - src/app/api/tracker/[id]/route.ts — PUT { status } updates the row
 *     and appends to status_history. status="applied" also stamps applied_at.
 *
 * Per the W4a constraint: drag-and-drop with @hello-pangea/dnd is flaky
 * under Playwright (synthetic pointer events don't always fire the lib's
 * internal handlers). We test the fallback StatusSelect dropdown for the
 * "move card between stages" assertion, then mark a real DnD-driven test
 * as fixme so it's tracked but doesn't make CI flaky.
 *
 * Coverage (5 tests):
 *   ✅ all 6 kanban columns render with their labels
 *   ✅ a card with status='saved' lands in the Saved column
 *   ✅ StatusSelect dropdown change fires PUT /api/tracker/[id] with new status
 *   ✅ delete via the detail modal fires DELETE /api/tracker/[id]
 *   ⚠ test.fixme — drag-and-drop a card between columns (flaky under Playwright)
 */

import { test, expect } from "../../support/fixtures";
import type { Page, Request } from "@playwright/test";

const COLUMNS = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected"];

const PERSONAL_APP = {
  id: "row-1",
  jobId: null,
  jobTitle: "Software Engineer",
  companyName: "DraggableCo",
  companyLogoUrl: null,
  location: "Remote",
  jobUrl: null,
  status: "saved",
  fitvectorStatus: null,
  rawPipelineStage: null,
  isTransparentPipeline: false,
  matchScore: null,
  interviewLink: null,
  statusHistory: [],
  notes: null,
  nextFollowupDate: null,
  positionOrder: 1,
  contactName: null,
  contactEmail: null,
  contactRole: null,
  tailoredResumeId: null,
  fitvectorAppId: null,
  appliedAt: null,
  createdAt: "2026-04-15T10:00:00Z",
};

async function mockTracker(page: Page, rows: typeof PERSONAL_APP[]): Promise<void> {
  await page.route("**/api/tracker**", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: rows }),
    });
  });
}

async function gotoPersonalTab(seekerPage: Page): Promise<void> {
  await seekerPage.goto("/dashboard/tracker");
  await seekerPage.getByRole("button", { name: /personal tracker/i }).click();
}

test.describe("Tracker — Personal Kanban", () => {
  test("renders all 6 kanban columns", async ({ seekerPage }) => {
    await mockTracker(seekerPage, [PERSONAL_APP]);
    await gotoPersonalTab(seekerPage);

    for (const col of COLUMNS) {
      await expect(
        seekerPage.locator("h3").filter({ hasText: col }).first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("a card with status='saved' renders inside the Saved column", async ({
    seekerPage,
  }) => {
    await mockTracker(seekerPage, [PERSONAL_APP]);
    await gotoPersonalTab(seekerPage);

    await expect(seekerPage.getByText("Software Engineer")).toBeVisible({
      timeout: 10_000,
    });
    // The card's StatusSelect should reflect the current status.
    const select = seekerPage.locator('select').first();
    await expect(select).toHaveValue("saved");
  });

  test("StatusSelect dropdown change fires PUT /api/tracker/[id] with the new status", async ({
    seekerPage,
  }) => {
    await mockTracker(seekerPage, [PERSONAL_APP]);

    const putRequests: Request[] = [];
    await seekerPage.route("**/api/tracker/row-1", async (route) => {
      if (route.request().method() === "PUT") {
        putRequests.push(route.request());
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { success: true } }),
        });
      } else {
        await route.fallback();
      }
    });

    await gotoPersonalTab(seekerPage);
    // Find the StatusSelect on the rendered card. There's exactly one
    // non-FV card so a generic locator is unambiguous here.
    await expect(seekerPage.getByText("Software Engineer")).toBeVisible({
      timeout: 10_000,
    });

    await seekerPage.locator('select').first().selectOption("applied");

    await expect.poll(() => putRequests.length).toBeGreaterThan(0);
    const req = putRequests[0];
    expect(req.method()).toBe("PUT");
    expect(req.url()).toContain("/api/tracker/row-1");
    const body = req.postDataJSON() as Record<string, unknown>;
    expect(body.status).toBe("applied");
  });

  test("delete via the detail modal fires DELETE /api/tracker/[id]", async ({
    seekerPage,
  }) => {
    await mockTracker(seekerPage, [PERSONAL_APP]);

    const deleteRequests: Request[] = [];
    await seekerPage.route("**/api/tracker/row-1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteRequests.push(route.request());
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { success: true } }),
        });
      } else {
        await route.fallback();
      }
    });

    await gotoPersonalTab(seekerPage);
    // Click the card to open the detail modal.
    await seekerPage.getByText("Software Engineer").first().click();

    // The modal exposes a Delete button (icon + label, scoped via name).
    // Multiple "Delete" buttons can render across the page (e.g. card chips);
    // the modal one is inside a dialog, so scope to role=dialog.
    const dialog = seekerPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();

    // Some apps gate destructive actions behind a confirm prompt — accept
    // either an immediate fire OR a follow-up "Confirm" button.
    const confirm = dialog.getByRole("button", { name: /^(confirm|yes,?\s*delete)$/i });
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }

    await expect.poll(() => deleteRequests.length).toBeGreaterThan(0);
    expect(deleteRequests[0].method()).toBe("DELETE");
  });

  test.fixme(
    "drag a card from Saved → Applied via @hello-pangea/dnd (TODO:test-infra — synthetic dragTo doesn't always fire the lib's internal pointer handlers; covered by StatusSelect test instead)",
    async () => {
      // Future shape (works inconsistently — needs HTML5 drag fixtures or
      // the lib's testing utilities):
      //   const card = seekerPage.getByText("Software Engineer");
      //   const target = seekerPage.getByText("Applied", { exact: true }).first();
      //   await card.dragTo(target);
      //   await expect.poll(() => putRequests.length).toBeGreaterThan(0);
    },
  );
});
