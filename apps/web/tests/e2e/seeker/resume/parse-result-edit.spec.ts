/**
 * seeker/resume/parse-result-edit.spec.ts
 *
 * MASTER_PLAN expects an inline editor for the parsed resume on
 * /dashboard/resume — edit summary, edit experience entry, edit skills,
 * save persists.
 *
 * Reality (verified against src/app/(dashboard)/dashboard/resume/page.tsx
 * + the BaseResumeUpload subcomponent):
 *
 *   - The "View" toggle renders a READ-ONLY block: Name, Email, Skills,
 *     "Experience entries: N", "Education entries: N". There is no inline
 *     edit, no "Save" button, no PUT to /api/seeker/profile from this page.
 *   - The actual editable fields for skills and work history live on
 *     /dashboard/settings — which is already exercised by:
 *       • [seeker/profile/skills.spec.ts](../profile/skills.spec.ts)
 *       • [seeker/profile/experience.spec.ts](../profile/experience.spec.ts)
 *
 * Rather than duplicate those, this file documents the gap. When the
 * inline editor ships:
 *   1. Add ResumePage.editParsedSummary / editExperience / editSkills
 *      getters to resume.page.ts
 *   2. Replace the four bodies below with real form-driving logic
 *   3. Drop the test.fixme() wrappers
 *
 * Coverage (4 tests, all fixme):
 *   ⚠ edit summary on the parsed view
 *   ⚠ edit a single experience entry inline
 *   ⚠ edit skills inline
 *   ⚠ save persists to user_profiles.parsed_resume_json
 */

import { test } from "../../support/fixtures";

test.describe("Resume — parse-result inline edit (NOT YET IMPLEMENTED in UI)", () => {
  test.fixme(
    "edit summary on /dashboard/resume parsed view (TODO: build inline editor — currently the View toggle renders read-only)",
    async () => {
      // Future shape:
      //   const resume = new ResumePage(seekerPage);
      //   await resume.goto();
      //   await resume.viewParsedButton.click();
      //   await resume.editSummaryButton.click();
      //   await resume.summaryTextarea.fill("Senior platform engineer with…");
      //   await resume.saveSummaryButton.click();
      //   await expect(seekerPage.getByText("Senior platform engineer")).toBeVisible();
    },
  );

  test.fixme(
    "edit a single experience entry inline (TODO: editor not built — workaround: /dashboard/settings work history)",
    async () => {
      // Until the inline editor lands, work-history edits go through
      // seeker/profile/experience.spec.ts → /dashboard/settings.
    },
  );

  test.fixme(
    "edit skills inline (TODO: editor not built — workaround: /dashboard/settings skills tag input)",
    async () => {
      // See seeker/profile/skills.spec.ts for the live coverage on the
      // settings page.
    },
  );

  test.fixme(
    "save persists to user_profiles.parsed_resume_json (TODO: PUT route doesn't exist for parsed_resume_json from /dashboard/resume)",
    async () => {
      // /api/seeker/profile PUT accepts skills + workHistory but NOT a
      // parsed_resume_json patch. /api/user/profile PUT does accept it but
      // the UI never calls it. Wire whichever is appropriate when the
      // editor ships.
    },
  );
});
