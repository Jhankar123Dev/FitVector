/**
 * seeker/profile/experience.spec.ts
 *
 * Drives the Work History section on /dashboard/settings.
 *
 * Verified against src/app/(dashboard)/dashboard/settings/page.tsx:
 *   - "Add Experience" button opens an inline form with: Company* / Title* /
 *     Start Date / End Date / "I currently work here" / Description.
 *   - Save button is disabled until both Company AND Title have a non-blank value.
 *   - Every save/edit/delete autosaves to PUT /api/seeker/profile
 *     { workHistory: [...] }.
 *   - Work entries render as: "{title} at {company}" + period line.
 *
 * Coverage (4 tests):
 *   ✅ list preloads existing work entries from user_profiles.work_history
 *   ✅ Add Experience flow inserts a new entry; persists in DB
 *   ✅ Edit flow updates an existing entry; persists in DB
 *   ✅ Delete flow removes an entry; persists in DB
 */

import { test, expect } from "../../support/fixtures";
import { signInAs } from "../../support/helpers/auth";
import { SettingsPage } from "../../support/page-objects/seeker/settings.page";
import { getAdminClient } from "../../support/helpers/db-helpers";

interface WorkEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
}

async function seedWorkHistory(userId: string, entries: WorkEntry[]): Promise<void> {
  const supabase = getAdminClient();
  await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, work_history: entries }, { onConflict: "user_id" });
}

async function fetchWorkHistory(userId: string): Promise<WorkEntry[]> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("work_history")
    .eq("user_id", userId)
    .single();
  return (data?.work_history ?? []) as WorkEntry[];
}

test.describe("Profile — work history (experience)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.use({ ephemeralSeekerOptions: { onboardingCompleted: true } });

  test("preloads existing entries from user_profiles.work_history", async ({
    page,
    ephemeralSeeker,
  }) => {
    await seedWorkHistory(ephemeralSeeker.id, [
      {
        company: "Acme Corp",
        title: "Engineer",
        startDate: "01/2020",
        endDate: "12/2022",
        isCurrent: false,
      },
    ]);
    await signInAs(page.context(), ephemeralSeeker);

    const settings = new SettingsPage(page);
    await settings.goto();

    // Rendered as "{title} at {company}".
    await expect(page.getByText("Engineer at Acme Corp")).toBeVisible();
  });

  test("Add Experience inserts a new entry and persists it", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.addExperienceButton.click();
    await settings.workCompanyInput.fill("Globex");
    await settings.workTitleInput.fill("Senior Engineer");
    await settings.workStartDateInput.fill("06/2023");
    await settings.workCurrentCheckbox.check();

    const putPromise = page.waitForResponse(
      (res) => res.url().includes("/api/seeker/profile") && res.request().method() === "PUT",
    );
    await settings.workFormSaveButton.click();
    expect((await putPromise).status()).toBe(200);

    await expect(page.getByText("Senior Engineer at Globex")).toBeVisible();

    const persisted = await fetchWorkHistory(ephemeralSeeker.id);
    const match = persisted.find((e) => e.company === "Globex");
    expect(match, "expected new Globex entry to land in the DB").toBeTruthy();
    expect(match!.isCurrent).toBe(true);
  });

  test("Edit flow updates an existing entry", async ({ page, ephemeralSeeker }) => {
    await seedWorkHistory(ephemeralSeeker.id, [
      {
        company: "Initech",
        title: "Junior Dev",
        startDate: "01/2018",
        endDate: "06/2019",
        isCurrent: false,
      },
    ]);
    await signInAs(page.context(), ephemeralSeeker);

    const settings = new SettingsPage(page);
    await settings.goto();

    // Click "Edit" on the first row.
    await page.getByRole("button", { name: /^edit$/i }).first().click();
    await settings.workTitleInput.fill("Software Engineer II");

    const putPromise = page.waitForResponse(
      (res) => res.url().includes("/api/seeker/profile") && res.request().method() === "PUT",
    );
    await settings.workFormSaveButton.click();
    expect((await putPromise).status()).toBe(200);

    const persisted = await fetchWorkHistory(ephemeralSeeker.id);
    expect(persisted[0]?.title).toBe("Software Engineer II");
    await expect(page.getByText("Software Engineer II at Initech")).toBeVisible();
  });

  test("Delete flow removes an entry from the list and from DB", async ({
    page,
    ephemeralSeeker,
  }) => {
    await seedWorkHistory(ephemeralSeeker.id, [
      {
        company: "DeleteMe Inc",
        title: "Temp",
        startDate: "01/2024",
        endDate: "03/2024",
        isCurrent: false,
      },
    ]);
    await signInAs(page.context(), ephemeralSeeker);

    const settings = new SettingsPage(page);
    await settings.goto();
    await expect(page.getByText("Temp at DeleteMe Inc")).toBeVisible();

    const putPromise = page.waitForResponse(
      (res) => res.url().includes("/api/seeker/profile") && res.request().method() === "PUT",
    );
    // The trash icon button has aria-label="Delete".
    await page.getByRole("button", { name: /^delete$/i }).first().click();
    expect((await putPromise).status()).toBe(200);

    await expect(page.getByText("Temp at DeleteMe Inc")).not.toBeVisible();
    const persisted = await fetchWorkHistory(ephemeralSeeker.id);
    expect(persisted.find((e) => e.company === "DeleteMe Inc")).toBeUndefined();
  });
});
