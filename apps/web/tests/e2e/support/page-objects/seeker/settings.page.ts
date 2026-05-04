/**
 * support/page-objects/seeker/settings.page.ts
 *
 * Page object for /dashboard/settings.
 *
 * NB: the MASTER_PLAN's "Profile" specs (basic-info / skills / experience /
 * education) all live in *this* page — there is no separate /dashboard/profile
 * route. Education has no UI on the live page; specs that need it must
 * test.fixme.
 *
 * Verified against src/app/(dashboard)/dashboard/settings/page.tsx:
 *
 *   ┌─ Profile card ───────────────────────────────────────┐
 *   │  Full Name input  →  PUT /api/user/profile           │
 *   │  Email input (disabled)                              │
 *   │  Save Changes button                                 │
 *   └──────────────────────────────────────────────────────┘
 *   ┌─ Professional Profile card ──────────────────────────┐
 *   │  Current Role / Current Company                      │
 *   │  Phone / LinkedIn URL / Portfolio URL                │
 *   │  Save Contact Info button → PUT /api/seeker/profile  │
 *   │                                                      │
 *   │  Skills tag input (Enter to add, X to remove)        │
 *   │  Save Skills button → PUT /api/seeker/profile        │
 *   │                                                      │
 *   │  Work History list + Add Experience modal            │
 *   │     fields: company* / title* / start / end / current/ description
 *   │     save / delete autosave to /api/seeker/profile    │
 *   └──────────────────────────────────────────────────────┘
 *   Plan / Notifications / Appearance / Calendar / Verified cards follow.
 *
 * KNOWN BUG: The Profile card's "Save Changes" PUTs `{ fullName: name }`
 * to /api/user/profile, but that route's schema only accepts `name` —
 * the field is silently dropped. Specs assert on the no-op observable
 * behavior with a TODO:BUG comment.
 */

import type { Page, Locator } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard/settings");
    await this.page.getByRole("heading", { level: 1, name: /^Settings$/ }).waitFor();
  }

  // ── Card 1: Profile (basic info) ──────────────────────────────────────────

  get fullNameInput(): Locator {
    // First "Full Name" label on the page = Profile card. Settings does not
    // duplicate this label so a plain getByLabel is unambiguous.
    return this.page.getByLabel("Full Name");
  }

  get emailInput(): Locator {
    return this.page.getByLabel("Email");
  }

  get saveBasicInfoButton(): Locator {
    return this.page.getByRole("button", { name: /save changes/i });
  }

  // ── Card 2: Professional Profile ──────────────────────────────────────────

  get currentRoleInput(): Locator {
    return this.page.getByLabel("Current Role");
  }

  get currentCompanyInput(): Locator {
    return this.page.getByLabel("Current Company");
  }

  get phoneInput(): Locator {
    return this.page.getByLabel("Phone");
  }

  get linkedinUrlInput(): Locator {
    return this.page.getByLabel(/linkedin url/i);
  }

  get portfolioUrlInput(): Locator {
    return this.page.getByLabel(/portfolio url/i);
  }

  get saveContactInfoButton(): Locator {
    return this.page.getByRole("button", { name: /save contact info/i });
  }

  // ── Skills ────────────────────────────────────────────────────────────────

  get skillInput(): Locator {
    return this.page.getByPlaceholder(/type a skill and press enter/i);
  }

  get addSkillButton(): Locator {
    // The "+ Add" button next to the skill input. Scope to its parent flex
    // container so we don't collide with the work-history "Add Experience".
    return this.page
      .getByPlaceholder(/type a skill and press enter/i)
      .locator("..")
      .getByRole("button", { name: /^add$/i });
  }

  /** A rendered skill chip — clicking the inner X removes it. */
  skillChip(skill: string): Locator {
    return this.page.locator("span", { hasText: skill }).first();
  }

  removeSkillButton(skill: string): Locator {
    return this.page.getByRole("button", { name: new RegExp(`remove ${skill}`, "i") });
  }

  get saveSkillsButton(): Locator {
    return this.page.getByRole("button", { name: /save skills/i });
  }

  // ── Work history ──────────────────────────────────────────────────────────

  get addExperienceButton(): Locator {
    return this.page.getByRole("button", { name: /add experience/i });
  }

  get workCompanyInput(): Locator {
    // Inside the inline form modal — labelled "Company *".
    return this.page.getByLabel(/^company \*?$/i);
  }

  get workTitleInput(): Locator {
    return this.page.getByLabel(/^title \*?$/i);
  }

  get workStartDateInput(): Locator {
    return this.page.getByLabel(/start date/i);
  }

  get workEndDateInput(): Locator {
    return this.page.getByLabel(/end date/i);
  }

  get workCurrentCheckbox(): Locator {
    return this.page.getByLabel(/i currently work here/i);
  }

  /** "Save" or "Update" inside the inline work-form. */
  get workFormSaveButton(): Locator {
    return this.page.getByRole("button", { name: /^(save|update)$/i });
  }

  /** The work-entry row at index `idx`. Used for edit/delete. */
  workEntryAt(idx: number): Locator {
    return this.page.locator(
      'div.rounded-lg.border.border-border.bg-muted\\/30',
    ).nth(idx);
  }
}
