/**
 * seeker/profile/skills.spec.ts
 *
 * Drives the Skills tag-input on /dashboard/settings.
 *
 * Verified against src/app/(dashboard)/dashboard/settings/page.tsx:
 *   - input.placeholder = "Type a skill and press Enter"
 *   - Enter or "+ Add" button calls addSkill() which dedupes case-sensitively
 *   - Each chip renders an "X" button labelled "Remove {skill}"
 *   - "Save Skills" calls PUT /api/seeker/profile { skills: [...] }
 *
 * Coverage (4 tests):
 *   ✅ list renders existing skills from the DB
 *   ✅ adding a skill via Enter shows a chip
 *   ✅ removing a chip drops it from the list
 *   ✅ Save Skills persists the list — verified by re-loading the page
 */

import { test, expect } from "../../support/fixtures";
import { signInAs } from "../../support/helpers/auth";
import { SettingsPage } from "../../support/page-objects/seeker/settings.page";
import { getAdminClient } from "../../support/helpers/db-helpers";

async function seedSkills(userId: string, skills: string[]): Promise<void> {
  const supabase = getAdminClient();
  await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, skills }, { onConflict: "user_id" });
}

test.describe("Profile — skills", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.use({ ephemeralSeekerOptions: { onboardingCompleted: true } });

  test("preloads the existing skills from user_profiles.skills", async ({
    page,
    ephemeralSeeker,
  }) => {
    await seedSkills(ephemeralSeeker.id, ["TypeScript", "PostgreSQL"]);
    await signInAs(page.context(), ephemeralSeeker);

    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.skillChip("TypeScript")).toBeVisible();
    await expect(settings.skillChip("PostgreSQL")).toBeVisible();
  });

  test("adding a skill via Enter renders a new chip", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.skillInput.fill("Rust");
    await settings.skillInput.press("Enter");

    await expect(settings.skillChip("Rust")).toBeVisible();
    // Input clears after the chip is added.
    await expect(settings.skillInput).toHaveValue("");
  });

  test("clicking a chip's X removes it from the list", async ({ page, ephemeralSeeker }) => {
    await seedSkills(ephemeralSeeker.id, ["GraphQL"]);
    await signInAs(page.context(), ephemeralSeeker);

    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.skillChip("GraphQL")).toBeVisible();
    await settings.removeSkillButton("GraphQL").click();
    await expect(settings.skillChip("GraphQL")).not.toBeVisible();
  });

  test("Save Skills persists the list to user_profiles.skills", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);
    const settings = new SettingsPage(page);
    await settings.goto();

    // Add two new skills, then save.
    await settings.skillInput.fill("Python");
    await settings.skillInput.press("Enter");
    await settings.skillInput.fill("Docker");
    await settings.skillInput.press("Enter");

    const putPromise = page.waitForResponse(
      (res) => res.url().includes("/api/seeker/profile") && res.request().method() === "PUT",
    );
    await settings.saveSkillsButton.click();
    expect((await putPromise).status()).toBe(200);

    const supabase = getAdminClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("skills")
      .eq("user_id", ephemeralSeeker.id)
      .single();
    const persisted = (data?.skills ?? []) as string[];
    expect(persisted).toEqual(expect.arrayContaining(["Python", "Docker"]));
  });
});
