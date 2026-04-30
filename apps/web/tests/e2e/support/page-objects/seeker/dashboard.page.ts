/**
 * support/page-objects/seeker/dashboard.page.ts
 *
 * Page object for the seeker home at /dashboard.
 *
 * Verified against src/app/(dashboard)/dashboard/page.tsx:
 *   - <h1>Welcome back, {firstName}!</h1>
 *   - <h2>Quick Actions</h2> with 4 cards: Search Jobs, Tailor Resume,
 *     Generate Outreach, Track Applications. Each card has a Get Started
 *     <Link href="/dashboard/{jobs|resume|outreach|tracker}"> CTA.
 *   - 4 dynamic stat cards: Active Applications, Job Matches, Resumes
 *     Created, Messages Sent. Skeleton state uses .animate-pulse div while
 *     useDashboardStats() is loading.
 *
 * No "Jobs for You" section, no application-status / saved-jobs / resume-
 * strength widgets, no recent-activity feed exist on the live page despite
 * earlier audit notes — the POM has been corrected to match reality.
 */

import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard");
    // Wait for the welcome heading rather than networkidle — the dashboard
    // continues to refetch /api/user/dashboard-stats on focus, which keeps
    // networkidle from firing reliably.
    await this.welcomeHeading.first().waitFor({ state: "visible" });
  }

  // ── Header ────────────────────────────────────────────────────────────────

  /** Matches the literal h1 "Welcome back, {firstName}!" header. */
  get welcomeHeading(): Locator {
    return this.page.getByRole("heading", { level: 1, name: /welcome back/i });
  }

  /**
   * Tighter assertion than {@link welcomeHeading} — checks the rendered first
   * name matches what we expect. Pass the part before the first space of the
   * user's full_name (e.g. "playwright" for "playwright e2e").
   */
  greetingFor(firstName: string): Locator {
    return this.page.getByRole("heading", {
      level: 1,
      name: new RegExp(`welcome back,\\s*${firstName}`, "i"),
    });
  }

  // ── Quick Actions ─────────────────────────────────────────────────────────

  get quickActionsHeading(): Locator {
    return this.page.getByRole("heading", { name: /quick actions/i });
  }

  /** One of "Search Jobs" | "Tailor Resume" | "Generate Outreach" | "Track Applications". */
  quickActionCard(title: string): Locator {
    return this.page
      .getByRole("heading", { name: new RegExp(`^${title}$`, "i") })
      .locator("..")
      .locator("..");
  }

  /** "Get Started" link inside a quick-action card identified by its title. */
  quickActionLink(title: string): Locator {
    return this.quickActionCard(title).getByRole("link", { name: /get started/i });
  }

  // ── Dynamic stats ─────────────────────────────────────────────────────────

  /** The 4 stat cards: returns the value cell for the given label. */
  statValue(label: string): Locator {
    return this.page
      .getByText(label, { exact: true })
      .locator("..")
      .getByText(/^\d+$/);
  }

  /** Skeleton placeholders shown while useDashboardStats() is loading. */
  get statSkeletons(): Locator {
    return this.page.locator(".animate-pulse");
  }
}
