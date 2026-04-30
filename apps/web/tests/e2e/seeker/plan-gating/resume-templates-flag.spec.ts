/**
 * seeker/plan-gating/resume-templates-flag.spec.ts
 *
 * Per-tier resume-template availability:
 *   free    → ['modern']                              (1 template)
 *   starter → ['modern', 'classic']                   (2 templates)
 *   pro     → ['modern', 'classic', 'minimal']        (3 templates)
 *   elite   → ['modern', 'classic', 'minimal', 'custom'] (4 templates)
 *
 * REALITY (verified via grep `resume_templates|resumeTemplates` across
 * apps/web/src — zero hits outside packages/shared/src/constants/plan-limits.ts):
 *
 *   The `resume_templates` flag is **defined in plan-limits.ts but never
 *   read by any UI code**. The TailorDialog template picker shows ALL
 *   templates regardless of tier. The /api/ai/tailor-resume route accepts
 *   `templateId` from the body without checking whether the user's tier
 *   includes that template. Free seekers can effectively use any template.
 *
 * Documented as **UI gap #19** in BUGS_FOUND.md. All 4 tier tests are
 * `test.fixme`'d until the picker (and ideally the route) start enforcing
 * the per-tier list.
 *
 * Coverage (4 tests, all fixme):
 *   ⚠ free → only "modern" template visible in the picker
 *   ⚠ starter → "modern" + "classic" visible
 *   ⚠ pro → "modern" + "classic" + "minimal" visible
 *   ⚠ elite → all 4 templates visible
 */

import { test } from "../../support/fixtures";

test.describe("Plan-gating — resume templates flag (NOT YET ENFORCED IN UI)", () => {
  test.fixme(
    "free tier sees only the 'modern' template in the tailor picker (TODO:UI-GAP — picker shows all templates regardless of plan tier)",
    async () => {
      // Future shape, when the picker reads useUser().planTier:
      //   await setPlanTier(seeker.id, "free");
      //   await openTailorDialog();
      //   const opts = page.locator('[data-template]');
      //   await expect(opts).toHaveCount(1);
      //   await expect(opts.first()).toHaveAttribute("data-template", "modern");
    },
  );

  test.fixme(
    "starter tier sees 'modern' + 'classic' in the tailor picker (2 templates)",
    async () => {
      // await setPlanTier(seeker.id, "starter");
      // await expect(page.locator('[data-template]')).toHaveCount(2);
    },
  );

  test.fixme(
    "pro tier sees 'modern' + 'classic' + 'minimal' (3 templates)",
    async () => {
      // await setPlanTier(seeker.id, "pro");
      // await expect(page.locator('[data-template]')).toHaveCount(3);
    },
  );

  test.fixme(
    "elite tier sees all 4 templates including 'custom'",
    async () => {
      // await setPlanTier(seeker.id, "elite");
      // await expect(page.locator('[data-template]')).toHaveCount(4);
      // await expect(page.locator('[data-template="custom"]')).toBeVisible();
    },
  );
});
