/**
 * seeker/profile/basic-info.spec.ts
 *
 * Profile basic-info specs. There is no /dashboard/profile route — the
 * Profile card lives on /dashboard/settings.
 *
 * Verified against src/app/(dashboard)/dashboard/settings/page.tsx:
 *   - Full Name <Input> wired to the user's name
 *   - Email <Input> rendered as `disabled` ("Email cannot be changed" copy)
 *   - "Save Changes" button POSTs PUT /api/user/profile { fullName }
 *
 * KNOWN BUG (TODO:BUG):
 *   The settings page sends `{ fullName: name }` but /api/user/profile
 *   only accepts `{ name }` (zod schema field). The fullName field is
 *   silently dropped and the name save is a no-op. Test 2 below asserts
 *   the no-op observable behavior.
 *
 * Coverage (4 tests):
 *   ✅ fields load with the current user's data
 *   ⚠ saving a new name returns ok BUT the DB row is unchanged (TODO:BUG)
 *   ✅ Email field is disabled (read-only)
 *   ✅ empty Full Name still allows save (route accepts optional name)
 */

import { test, expect } from "../../support/fixtures";
import { signInAs } from "../../support/helpers/auth";
import { SettingsPage } from "../../support/page-objects/seeker/settings.page";
import { getAdminClient } from "../../support/helpers/db-helpers";

test.describe("Profile — basic info (lives on /dashboard/settings)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Full Name and Email inputs preload the seeker's current data", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.fullNameInput).toHaveValue(ephemeralSeeker.fullName);
    await expect(settings.emailInput).toHaveValue(ephemeralSeeker.email);
  });

  test("clicking Save Changes is a no-op for full_name (TODO:BUG — settings sends fullName, /api/user/profile schema only reads name)", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);
    const settings = new SettingsPage(page);
    await settings.goto();

    const newName = "Updated Name";
    await settings.fullNameInput.fill(newName);

    // Wait for the PUT to complete before checking DB.
    const putPromise = page.waitForResponse(
      (res) => res.url().includes("/api/user/profile") && res.request().method() === "PUT",
    );
    await settings.saveBasicInfoButton.click();
    const put = await putPromise;
    expect(put.status()).toBe(200);

    // Current reality: full_name is unchanged because the client field name
    // doesn't match the schema. When the bug is fixed, flip this to .toBe(newName).
    const supabase = getAdminClient();
    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", ephemeralSeeker.id)
      .single();
    expect(
      data?.full_name,
      "TODO:BUG — once /api/user/profile accepts fullName, this should equal newName",
    ).toBe(ephemeralSeeker.fullName);
  });

  test("Email input is disabled and shows the immutable copy", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.emailInput).toBeDisabled();
    await expect(page.getByText(/email cannot be changed/i)).toBeVisible();
  });

  test("submitting an empty Full Name still returns 200 (route schema marks name optional)", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.fullNameInput.fill("");
    const putPromise = page.waitForResponse(
      (res) => res.url().includes("/api/user/profile") && res.request().method() === "PUT",
    );
    await settings.saveBasicInfoButton.click();
    const put = await putPromise;
    // The route schema makes `name` optional, so an empty payload is valid.
    // No client-side guard exists either — confirm the round-trip succeeds.
    expect(put.status()).toBe(200);
  });
});
