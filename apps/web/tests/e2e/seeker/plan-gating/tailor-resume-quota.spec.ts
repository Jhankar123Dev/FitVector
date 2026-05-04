/**
 * seeker/plan-gating/tailor-resume-quota.spec.ts
 *
 * Server-enforced resume-tailor quota.
 *
 * Verified via code-review-graph: tailor-resume/route.ts:37 calls hasQuota
 * with feature="resume_tailor".
 *
 * Per-tier limits: free 2 · starter 10 · pro 50 · elite -1
 *
 * The route also short-circuits with 400 if the seeker has no
 * parsed_resume_json on file. The factory's ephemeral seekers don't have
 * one by default, so we patch user_profiles before each test via a
 * beforeEach hook that runs alongside the factory's own beforeEach.
 */

import { test } from "../../support/fixtures";
import {
  generatePlanGatingSuite,
} from "../../support/fixtures/plan-fixture";
import { getAdminClient } from "../../support/helpers/db-helpers";

// Pre-seed parsed_resume_json so the route doesn't 400 before reaching the
// quota gate. The factory's beforeEach runs after this — the FK chain ends
// up: users (ephemeralSeeker) → user_profiles (this hook).
test.beforeEach(async ({ ephemeralSeeker }) => {
  const supabase = getAdminClient();
  await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: ephemeralSeeker.id,
        parsed_resume_json: {
          name: "Ephemeral Tester",
          email: ephemeralSeeker.email,
          skills: ["TypeScript"],
          experience: [],
          education: [],
        },
      },
      { onConflict: "user_id" },
    );
});

generatePlanGatingSuite({
  displayName: "resume tailor",
  feature: "resume_tailor",
  quotaByTier: { free: 2, starter: 10, pro: 50, elite: -1 },
  upgradeTo: "pro",
  action: (page) =>
    page.request.post("/api/ai/tailor-resume", {
      data: {
        jobTitle: "Senior Frontend Engineer",
        companyName: "Acme",
        jobDescription:
          "We're hiring a senior frontend engineer to lead our design system. " +
          "You'll work in TypeScript and React on a well-tested component library.",
      },
    }),
});
