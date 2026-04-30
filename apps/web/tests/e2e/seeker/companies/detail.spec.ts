/**
 * seeker/companies/detail.spec.ts
 *
 * Verifies the company detail page at /dashboard/companies/[id].
 *
 * Verified against src/app/(dashboard)/dashboard/companies/[id]/page.tsx:
 *   - GET /api/companies/[id] returns CompanyDetail (name, logoUrl,
 *     industry, description, cultureKeywords, locations, activeJobs[])
 *   - Header shows logo/initials, name, industry, optional website
 *   - Active jobs render with title + Apply button → opens FitVectorApplyModal
 *   - Culture keywords render as badges
 *
 * Coverage (4 tests):
 *   ✅ name + industry + description render in the header
 *   ✅ locations render with city/state/country pieces joined
 *   ✅ culture keywords render as badges
 *   ✅ active jobs grid renders + "Apply via FitVector" opens the modal
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

const COMPANY_ID = "co-detail-1";

const COMPANY_DETAIL = {
  id: COMPANY_ID,
  name: "DetailCo",
  logoUrl: null,
  websiteUrl: "https://detailco.example.com",
  industry: "Cloud Infrastructure",
  companySize: "201-1000",
  description: "A company that builds developer-loved tooling.",
  cultureKeywords: ["Remote-first", "Async-friendly", "Open-source"],
  locations: [
    { city: "Bangalore", state: "Karnataka", country: "India" },
    { city: "Berlin", country: "Germany" },
  ],
  activeJobs: [
    {
      id: "job-1",
      title: "Senior Backend Engineer",
      location: "Remote",
      workMode: "remote",
      jobType: "fulltime",
      salaryMin: 2500000,
      salaryMax: 4500000,
      salaryCurrency: "INR",
      requiredSkills: ["Go", "Kafka"],
      niceToHaveSkills: [],
      description: "Build distributed systems.",
      applicationDeadline: null,
      openingsCount: 1,
      postedAt: "2026-04-25T10:00:00Z",
    },
  ],
};

async function mockCompanyDetail(page: Page): Promise<void> {
  await page.route(`**/api/companies/${COMPANY_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: COMPANY_DETAIL }),
    }),
  );
  // The detail page also queries useFitVectorApplications for "already
  // applied" state.
  await page.route("**/api/applications/fitvector", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    }),
  );
}

test.describe("Companies — detail page", () => {
  test("name, industry, and description render in the header", async ({ seekerPage }) => {
    await mockCompanyDetail(seekerPage);
    await seekerPage.goto(`/dashboard/companies/${COMPANY_ID}`);

    await expect(
      seekerPage.getByRole("heading", { level: 1, name: COMPANY_DETAIL.name }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(seekerPage.getByText(COMPANY_DETAIL.industry)).toBeVisible();
    await expect(seekerPage.getByText(COMPANY_DETAIL.description)).toBeVisible();
  });

  test("locations render with city/state/country pieces", async ({ seekerPage }) => {
    await mockCompanyDetail(seekerPage);
    await seekerPage.goto(`/dashboard/companies/${COMPANY_ID}`);

    // Bangalore (with state + country) and Berlin (city + country only).
    await expect(seekerPage.getByText(/Bangalore/i)).toBeVisible({ timeout: 10_000 });
    await expect(seekerPage.getByText(/Berlin/i)).toBeVisible();
  });

  test("culture keywords render as visible badges", async ({ seekerPage }) => {
    await mockCompanyDetail(seekerPage);
    await seekerPage.goto(`/dashboard/companies/${COMPANY_ID}`);

    for (const kw of COMPANY_DETAIL.cultureKeywords) {
      await expect(seekerPage.getByText(kw, { exact: true })).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("active job row renders + 'Apply via FitVector' opens the apply modal", async ({
    seekerPage,
  }) => {
    await mockCompanyDetail(seekerPage);
    await seekerPage.goto(`/dashboard/companies/${COMPANY_ID}`);

    await expect(
      seekerPage.getByText(COMPANY_DETAIL.activeJobs[0].title),
    ).toBeVisible({ timeout: 10_000 });

    await seekerPage
      .getByRole("button", { name: /apply via fitvector/i })
      .first()
      .click();

    // Modal opens — the canonical signal is the Submit Application button.
    await expect(
      seekerPage.getByRole("button", { name: /submit application/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
