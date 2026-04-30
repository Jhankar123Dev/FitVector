# Bugs & gaps surfaced by the E2E suite

Living document. Every `TODO:BUG` and `test.fixme()` in the spec tree is recorded here so they can be triaged and don't get lost across sessions.

**Status legend:**
- 🐞 **Bug** — code is wrong, fix is small, ship as a focused PR
- 🚧 **Backend gap** — feature half-built; spec is ready to light up green when the backend lands
- 🎨 **UI gap** — section/page doesn't exist yet
- 🛠 **Test infra** — we can't test it from the client; needs a server-side hook or new dep
- 📋 **Design call** — ambiguous; flag for product/eng decision before changing code

Last audit: **W4d / FINAL (2026-04-30)** · **74 spec files written** · 4 bugs + 36 active `test.fixme()` markers — Playwright migration complete. W4d added 6 quota specs via `generatePlanGatingSuite()` (each emits 4 live tests + 1 fixme for the daily-reset migration), 3 feature-flag specs all-fixme'd (resume-templates picker / job-alerts feature / chrome-extension feature — none currently enforced in UI), and 1 upgrade-prompt spec testing the shared UpgradePrompt component on jobs + tracker surfaces.

---

## 🐞 Real bugs (production code is wrong)

| # | Where | What's broken | Fix sketch | Surfaced by |
|---|---|---|---|---|
| 1 | [`(auth)/login` middleware OR `/onboarding/page.tsx` OR `/dashboard/page.tsx`](apps/web/src/lib/auth.ts) | No `onboarding_completed` gate. A seeker with `onboarding_completed=false` can hit `/dashboard` and a fully-onboarded seeker can re-hit the wizard at `/onboarding`. | Add a server-side redirect in `(dashboard)/layout.tsx` (false → `/onboarding`) and in `/onboarding/page.tsx` (true → `/dashboard`). Or wire it into the `authorized()` callback in `lib/auth.ts`. | [seeker/onboarding/onboarding-redirect.spec.ts:61](apps/web/tests/e2e/seeker/onboarding/onboarding-redirect.spec.ts:61) |
| 2 | [`dashboard/settings/page.tsx:60`](apps/web/src/app/(dashboard)/dashboard/settings/page.tsx) ↔ [`api/user/profile/route.ts:5`](apps/web/src/app/api/user/profile/route.ts) | Settings "Save Changes" PUTs `{ fullName: name }` but the route's zod schema accepts only `{ name }`. Field is silently stripped — name save is a permanent no-op. | One-line fix: rename `fullName` → `name` in the settings handler **OR** add `fullName: z.string().optional()` (mapped to `name`) in the route schema. | [seeker/profile/basic-info.spec.ts:45](apps/web/tests/e2e/seeker/profile/basic-info.spec.ts:45) |
| 3 | [`(dashboard)/dashboard/jobs/page.tsx:88`](apps/web/src/app/(dashboard)/dashboard/jobs/page.tsx) | `savedJobIds` is component-local `useState<Set<string>>` — never derived from `/api/tracker` on mount, so saved state is wiped on every reload. The POST does write to the DB, but the UI loses the visual indicator. | Either derive `savedJobIds` from a fresh `useQuery(['tracker','saved'])` on the page, or fold `isSaved` into the `/api/jobs/search` response so each card knows its own state. | [seeker/jobs/save-job.spec.ts:158](apps/web/tests/e2e/seeker/jobs/save-job.spec.ts:158) |
| 4 | [`dashboard/settings/notifications/page.tsx`](apps/web/src/app/(dashboard)/dashboard/settings/notifications/page.tsx) | All 7 toggle rows are **uncontrolled** `<input type="checkbox" defaultChecked>` with no `onChange` handler. There is also NO PUT/PATCH endpoint for notification preferences. Toggling a row updates the checkbox in the DOM but the change is never persisted — refresh the page and every toggle resets to its default. The entire preferences flow is a visual stub. | Wire each `ToggleRow` to controlled state, add a "Save" button (or auto-save on change), and ship `PUT /api/user/notification-preferences` that upserts a `user_notification_prefs` row. | [seeker/settings/notifications.spec.ts](apps/web/tests/e2e/seeker/settings/notifications.spec.ts) — 1 fixme |

---

## 🚧 Backend gaps (specs scaffolded, ready to flip green)

| # | Where | What's missing | Spec waiting |
|---|---|---|---|
| 4 | [`api/auth/signup/route.ts`](apps/web/src/app/api/auth/signup/route.ts) | Welcome email is never sent. The route inserts the user and returns 200 — no `sendEmail()` call. The wrapper at `lib/email.ts` already exists and forks to the email-sink in test mode. | [auth/seeker-signup.spec.ts:200](apps/web/tests/e2e/auth/seeker-signup.spec.ts:200) |
| 5 | Quota routes (cold-email, linkedin-msg, referral-msg, tailor-resume, jobs/search, tracker) | Quota windows are **monthly** today (`monthStart`-keyed), not the 24h rolling window the team agreed to. Same fixme is auto-emitted for each `planGatingFixture()` spec. | [support/fixtures/plan-fixture.ts:175](apps/web/tests/e2e/support/fixtures/plan-fixture.ts:175) — fires once per plan-gating spec (W5 will materialise 6 of these) |
| 6 | `/login` page metadata | No `<meta name="robots" content="noindex">`. Public auth pages should not be indexable. | [public/seo-meta.spec.ts:53](apps/web/tests/e2e/public/seo-meta.spec.ts:53) |

---

## 🎨 UI gaps (page/section doesn't exist yet)

| # | Where | What's missing | Spec waiting |
|---|---|---|---|
| 7 | `/dashboard/settings` Education section | MASTER_PLAN expects an Education editor (list/add/edit/delete) on the seeker profile. Settings page has Profile / Professional / Skills / Work-history but no Education. The route schema also doesn't accept an `education` field. | [seeker/profile/education.spec.ts:31-60](apps/web/tests/e2e/seeker/profile/education.spec.ts) — 4 tests, all fixme |
| 8 | `/employer/assessments/[id]/results` POM | The "flagged submission shows warning badge to employer" test needs a results-page POM that doesn't exist yet. | [anon/assessment-anti-cheat.spec.ts:133](apps/web/tests/e2e/anon/assessment-anti-cheat.spec.ts:133) |
| 9 | `/pricing` standalone route | Pricing currently lives as a `#pricing` anchor on `/`. Canonical-URL test fixme'd until/unless a separate route ships. **Design call** — not necessarily a bug. | [public/seo-meta.spec.ts:41](apps/web/tests/e2e/public/seo-meta.spec.ts:41) |
| 12 | `/dashboard/resume` parsed-data inline editor | The "View" toggle on BaseResumeUpload renders parsed name/email/skills/exp/edu as **read-only**. There's no inline edit, no PUT route from this page. The closest editable surface is `/dashboard/settings` (skills + work history only — no education). MASTER_PLAN's "edit summary / edit experience / edit skills inline / save persists" all fixme'd. | [seeker/resume/parse-result-edit.spec.ts](apps/web/tests/e2e/seeker/resume/parse-result-edit.spec.ts) — 4 tests, all fixme |
| 13 | Outreach tone selector | The action bar in `/dashboard/jobs` hardcodes `tone: "professional"` (jobs/page.tsx:152) when calling /api/ai/cold-email and friends. The Python prompt accepts other tones (conversational/confident) and the API contract carries the field — only the UI dropdown is missing. **Quick win**: add a 3-option pill selector above the outreach buttons. | [seeker/outreach/cold-email-generate.spec.ts](apps/web/tests/e2e/seeker/outreach/cold-email-generate.spec.ts) — 1 fixme |
| 15 | Job Alerts feature (entire surface) | code-review-graph keyword search returned **zero** matches for `alerts` — no `/dashboard/alerts` route, no `/api/user/alerts` endpoint, no `JobAlert` component anywhere in the tree. The Starter plan card on `/dashboard/settings/plan` lists "Job alerts" as a paid benefit, but the feature doesn't exist. MASTER_PLAN expected create + manage + Free-shows-upgrade. | Build the page (form: keyword + location + frequency), the route (CRUD on a `job_alerts` table), and the cron that emails matches. Then unwrap the 7 fixmes in alerts/. | [seeker/alerts/create-alert.spec.ts](apps/web/tests/e2e/seeker/alerts/create-alert.spec.ts) + [seeker/alerts/manage-alerts.spec.ts](apps/web/tests/e2e/seeker/alerts/manage-alerts.spec.ts) — 7 tests, all fixme |
| 16 | Standalone notifications inbox page | No `/dashboard/notifications` route exists. Notifications surface only as the **bell-dropdown** in the navbar (NotificationDropdown component). MASTER_PLAN expected a full inbox page (list, mark-read, delete). The dropdown covers list + mark-all-read, but there's no per-item delete and no full-page view. | Build a `/dashboard/notifications` page that reuses NotificationDropdown's data layer + adds per-item delete + pagination. Inbox specs are reframed against the dropdown for now. | [seeker/notifications/inbox.spec.ts](apps/web/tests/e2e/seeker/notifications/inbox.spec.ts) — already covers the bell dropdown; no fixme since the dropdown IS the current canonical surface |
| 17 | Plan upgrade → checkout wiring | The "Upgrade" button on each plan card in `/dashboard/settings/plan` has **no `onClick` handler** — clicking does nothing. No Stripe (or any) checkout integration exists. Current-plan button correctly disables itself, but every other tier's button is a dead-end. | Wire each non-current tier's Upgrade button to a `/api/billing/checkout` route that mints a Stripe Checkout Session and redirects via `window.location.href`. | [seeker/settings/plan.spec.ts](apps/web/tests/e2e/seeker/settings/plan.spec.ts) — 1 fixme |
| 18 | True realtime notifications | `useNotifications` is a plain `useQuery` with no `refetchInterval` and no Supabase channel subscription. New notifications only appear after a manual refetch (page reload or another bell open). | Wrap `useNotifications` in a `supabase.channel('seeker:notifications').on('INSERT', …)` listener that calls `qc.invalidateQueries(['notifications'])` on every push. | [seeker/notifications/realtime.spec.ts](apps/web/tests/e2e/seeker/notifications/realtime.spec.ts) — 1 fixme |
| 19 | Resume-templates per-tier picker filter | `PLAN_LIMITS[tier].resume_templates` defines which templates each tier sees, but a code-wide grep for `resume_templates`/`resumeTemplates` returned **zero hits** outside `plan-limits.ts`. The TailorDialog shows all templates regardless of tier, and the `/api/ai/tailor-resume` route accepts any `templateId` from the body without checking. Free seekers can effectively use any template. | Read `useUser().planTier` in TailorDialog's template picker, filter `TEMPLATES.filter(t => PLAN_LIMITS[tier].resume_templates.includes(t.id))`. Server-side: validate `body.templateId` against the tier list in `/api/ai/tailor-resume`. | [seeker/plan-gating/resume-templates-flag.spec.ts](apps/web/tests/e2e/seeker/plan-gating/resume-templates-flag.spec.ts) — 4 fixmes |
| 20 | Chrome-extension feature flag | `PLAN_LIMITS[tier].chrome_extension` defines tier access but **no UI surface reads it** (zero grep hits in apps/web/src). There's no install/connect CTA anywhere, no extension actually shipped, and no API gate. Pure forward-looking flag. | Build the install/connect surface (likely a card on `/dashboard/settings` or a banner on `/dashboard`); gate visibility on `useUser().planTier && PLAN_LIMITS[tier].chrome_extension`. | [seeker/plan-gating/chrome-extension-flag.spec.ts](apps/web/tests/e2e/seeker/plan-gating/chrome-extension-flag.spec.ts) — 4 fixmes |

---

## 🛠 Test-infra blockers

| # | What we can't test | Why | Unblock |
|---|---|---|---|
| 10 | Python `/ai/parse-resume` 503 fallback | Server-side `fetch()` to the Python service can't be intercepted from the Playwright client. | Add a `PYTHON_PARSE_FORCE_ERROR=true` env hook in `/api/ai/parse-resume/route.ts` that short-circuits to a 500 for tests. ([resume-parse-error.spec.ts:96](apps/web/tests/e2e/seeker/onboarding/resume-parse-error.spec.ts:96)) |
| 11 | Axe a11y scan on `/` landing | `@axe-core/playwright` not in `apps/web/package.json`. | `pnpm --filter web add -D @axe-core/playwright`, then unwrap the fixme. ([public/landing.spec.ts:81](apps/web/tests/e2e/public/landing.spec.ts:81)) |
| 14 | Drag-and-drop a kanban card between columns | `@hello-pangea/dnd` uses pointer events that don't reliably fire under Playwright's synthetic `dragTo()` — tests flake intermittently. The `StatusSelect` dropdown on each card already covers the move-stage path deterministically, so the DnD test is documented as fixme. | When kanban DnD becomes safety-critical: either swap the lib for `dnd-kit` (better Playwright story), use the lib's testing utilities, or drive HTML5 drag fixtures directly. ([seeker/tracker/personal-kanban.spec.ts](apps/web/tests/e2e/seeker/tracker/personal-kanban.spec.ts) — 1 fixme) |

---

## How to use this file

- **When a fix lands**, search the spec for the matching `TODO:BUG` / `test.fixme` line, flip the assertion (or remove the `.fixme` wrapper), and delete the row here.
- **When a new test surfaces a bug**, append a row in the right section. Keep the description tight; the spec file already has the long version.
- **Counts above** are a pulse — update after each spec batch lands.

When this file gets long enough that scrolling hurts, split into `BUGS_OPEN.md` / `BUGS_FIXED.md`. Until then, one file is fine.
