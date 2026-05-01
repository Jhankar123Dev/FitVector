/**
 * seeker/profile/education.spec.ts
 *
 * MASTER_PLAN expects an Education section on the seeker profile (list /
 * add / edit / delete). Reality on the live page (verified against
 * src/app/(dashboard)/dashboard/settings/page.tsx and
 * src/app/api/seeker/profile/route.ts):
 *
 *   - There is NO Education UI on /dashboard/settings.
 *   - The /api/seeker/profile route's GET response shape doesn't include an
 *     `education` field; the schema for PUT doesn't accept one either.
 *   - user_profiles.parsed_resume_json may contain education entries from the
 *     resume parser, but they're not surfaced as an editable section.
 *
 * The tests below are scaffolded but `test.fixme()`'d until the Education
 * section ships. When that happens:
 *   1. Build out a SettingsPage.education* getters block in settings.page.ts.
 *   2. Replace the four bodies with real form-driving logic.
 *   3. Drop the test.fixme() wrappers.
 *
 * Coverage (4 tests, all fixme):
 *   ⚠ list renders existing education entries
 *   ⚠ Add Education inserts a new entry
 *   ⚠ Edit flow updates an existing entry
 *   ⚠ Delete flow removes an entry
 */

import { test } from "../../support/fixtures";

test.describe("Profile — education (NOT YET IMPLEMENTED in UI)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.use({ ephemeralSeekerOptions: { onboardingCompleted: true } });
  test.fixme(
    "education list renders existing entries (TODO: add Education section to /dashboard/settings + extend /api/seeker/profile schema with education[])",
    async () => {
      // Future shape:
      //   await seedEducation(ephemeralSeeker.id, [{ school, degree, ... }]);
      //   await signInAs(page.context(), ephemeralSeeker);
      //   const settings = new SettingsPage(page);
      //   await settings.goto();
      //   await expect(page.getByText("BSc Computer Science · MIT")).toBeVisible();
    },
  );

  test.fixme(
    "Add Education inserts a new entry (TODO: implement education editor)",
    async () => {
      // await settings.addEducationButton.click();
      // await settings.educationSchoolInput.fill("...");
      // ...
    },
  );

  test.fixme(
    "Edit Education updates an existing entry (TODO: implement education editor)",
    async () => {
      // await page.getByRole("button", { name: /^edit$/i }).nth(eduIdx).click();
      // ...
    },
  );

  test.fixme(
    "Delete Education removes an entry (TODO: implement education editor)",
    async () => {
      // await page.getByRole("button", { name: /^delete$/i }).nth(eduIdx).click();
      // ...
    },
  );
});
