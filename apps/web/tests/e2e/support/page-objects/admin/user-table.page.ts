/**
 * support/page-objects/admin/user-table.page.ts
 *
 * Page object for /admin/users.
 * Selectors verified against apps/web/src/app/(admin)/admin/users/page.tsx.
 */

import type { Page, Locator } from "@playwright/test";

export type AdminRoleFilter = "" | "seeker" | "employer" | "superadmin";
export type AdminPlanOption = "free" | "starter" | "pro" | "elite";
export type AdminStatusOption = "active" | "suspended" | "onboarding";

export class AdminUserTablePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/users");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search/i).first();
  }

  roleFilterButton(role: AdminRoleFilter | "all"): Locator {
    const label = role === "" || role === "all" ? "all" : role;
    return this.page.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
  }

  // ── Table ─────────────────────────────────────────────────────────────────

  get rows(): Locator {
    return this.page.getByRole("row");
  }

  rowByEmail(email: string): Locator {
    return this.page.getByRole("row").filter({ hasText: email });
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  get prevPageButton(): Locator {
    return this.page.getByRole("button", { name: /previous|prev/i });
  }

  get nextPageButton(): Locator {
    return this.page.getByRole("button", { name: /next/i });
  }

  // ── Edit user dialog ──────────────────────────────────────────────────────

  editButtonForEmail(email: string): Locator {
    return this.rowByEmail(email).getByRole("button", { name: /edit/i });
  }

  get editDialog(): Locator {
    return this.page.getByRole("dialog");
  }

  planSelect(): Locator {
    return this.editDialog.getByRole("combobox", { name: /plan/i });
  }

  planOption(plan: AdminPlanOption): Locator {
    return this.editDialog.getByRole("option", { name: plan });
  }

  statusSelect(): Locator {
    return this.editDialog.getByRole("combobox", { name: /status/i });
  }

  statusOption(status: AdminStatusOption): Locator {
    return this.editDialog.getByRole("option", { name: status });
  }

  get saveEditButton(): Locator {
    return this.editDialog.getByRole("button", { name: /^save$/i });
  }

  // ── Toast notifications ──────────────────────────────────────────────────

  get successToast(): Locator {
    return this.page.getByText(/updated successfully|user saved/i);
  }

  get failureToast(): Locator {
    return this.page.getByText(/update failed|cannot demote/i);
  }
}
