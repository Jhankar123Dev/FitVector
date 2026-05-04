/**
 * support/page-objects/employer/team.page.ts
 *
 * Page object for /employer/team — RBAC-gated member management.
 *
 * RBAC reality (verified via code-review-graph):
 *   - POST /api/employer/company/members      → admin only
 *   - PUT  /api/employer/company/members/[id] → admin only
 *   - PUT  /api/employer/company              → admin only
 *   - PUT  /api/employer/branding             → admin or recruiter
 */

import type { Page, Locator } from "@playwright/test";

export type CompanyMemberRole = "admin" | "recruiter" | "hiring_manager" | "viewer";

export class TeamPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/employer/team");
    await this.page.waitForLoadState("networkidle");
  }

  // ── List view ─────────────────────────────────────────────────────────────

  get heading(): Locator {
    return this.page.getByRole("heading", { name: /team/i });
  }

  get memberRows(): Locator {
    return this.page.getByTestId("team-member-row");
  }

  memberRowByEmail(email: string): Locator {
    return this.page.getByRole("row").filter({ hasText: email });
  }

  // ── Invite member ─────────────────────────────────────────────────────────

  get inviteMemberButton(): Locator {
    return this.page.getByRole("button", { name: /invite member|add member/i });
  }

  get inviteDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /invite/i });
  }

  get inviteEmailInput(): Locator {
    return this.inviteDialog.getByLabel(/email/i);
  }

  get inviteRoleSelect(): Locator {
    return this.inviteDialog.getByRole("combobox", { name: /role/i });
  }

  get sendInviteButton(): Locator {
    return this.inviteDialog.getByRole("button", { name: /send invite|invite/i });
  }

  // ── Change role ───────────────────────────────────────────────────────────

  changeRoleButtonForEmail(email: string): Locator {
    return this.memberRowByEmail(email).getByRole("button", { name: /change role|edit/i });
  }

  get roleChangeDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /change role/i });
  }

  roleOption(role: CompanyMemberRole): Locator {
    return this.roleChangeDialog.getByRole("option", { name: role });
  }

  get saveRoleButton(): Locator {
    return this.roleChangeDialog.getByRole("button", { name: /save/i });
  }

  // ── Remove member ─────────────────────────────────────────────────────────

  removeButtonForEmail(email: string): Locator {
    return this.memberRowByEmail(email).getByRole("button", { name: /remove|delete/i });
  }

  get removeConfirmDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /remove this member/i });
  }

  get removeConfirmButton(): Locator {
    return this.removeConfirmDialog.getByRole("button", { name: /remove/i });
  }

  // ── RBAC error toast ──────────────────────────────────────────────────────

  get forbiddenToast(): Locator {
    return this.page.getByText(/insufficient (role|permission)|forbidden/i);
  }
}
