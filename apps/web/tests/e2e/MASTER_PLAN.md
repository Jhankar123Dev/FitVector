# FitVector Pro — E2E Test Master Plan

> **Status:** Inventory **v2.0 (locked)** — superseded v1 after deep codebase audit on 2026-04-30, team decisions baked in  
> **Spec files:** 168  
> **Individual tests:** ~503  
> **Framework:** Playwright `@playwright/test` v1.45.0  
> **Auth strategy:** Direct NextAuth API (CSRF → POST credentials → verify session)  
> **DB state strategy:** Hybrid (Option C) — persistent seed accounts for read flows, ephemeral records for write/destructive flows  
> **Ground-truth method:** Every spec description below was verified against `code-review-graph` queries on the live graph (1410 nodes, 12,698 edges) on 2026-04-30. Plan-gating, RBAC, and rate-limit claims map to actual `hasQuota` / `requireRole` / `middleware.ts` call sites — **not assumed feature parity**.

---

## What changed from v1

| v1 (fiction) | v2 (verified) |
|---|---|
| 14 plan-gated features | **6 quota-enforced features** + **3 frontend feature flags** + **1 array-cap feature** |
| Employer plan-gating section (6 specs) | **REMOVED** — no employer-side limits exist in `plan-limits.ts` |
| Generic "applications/profile/settings" specs | Replaced with real-feature specs: outreach, tracker, tests, mock interviews, schedule, community (3 sub-features), companies, analytics, verification |
| Generic employer "team/jobs/pipeline" | Expanded to: branding, promotions, talent-pool, interview panels, scheduling, candidate detail drawer, bulk screen-all, duplicate, AI question gen |
| Public flows missed | Added: anonymous assessment-take (token), anonymous AI interview (token), code execute, public job apply |
| ~134 specs / ~370 tests | **162 specs / ~470 tests** |

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Folder Structure](#2-folder-structure)
3. [Support Layer](#3-support-layer)
4. [Plan-Gating Reality Map](#4-plan-gating-reality-map)
5. [RBAC Reality Map](#5-rbac-reality-map)
6. [Rate-Limiter Reality Map](#6-rate-limiter-reality-map)
7. [Test Inventory — Auth (12 specs)](#7-test-inventory--auth)
8. [Test Inventory — Public (3 specs)](#8-test-inventory--public)
9. [Test Inventory — Anonymous Token Flows (4 specs)](#9-test-inventory--anonymous-token-flows)
10. [Test Inventory — Seeker (54 specs)](#10-test-inventory--seeker)
11. [Test Inventory — Employer (62 specs)](#11-test-inventory--employer)
12. [Test Inventory — Admin (16 specs)](#12-test-inventory--admin)
13. [Test Inventory — API / Edge (11 specs)](#13-test-inventory--api--edge)
14. [8-Week Phased Rollout](#14-8-week-phased-rollout)
15. [Full Checklist (162 specs)](#15-full-checklist)

---

## 1. Architecture Decisions

### 1.1 Playwright Projects (`playwright.config.ts`)

| Project | Role | Dependencies | testMatch |
|---|---|---|---|
| `setup:seeker` | auth setup | — | `**/setup/seeker.setup.ts` |
| `setup:employer` | auth setup | — | `**/setup/employer.setup.ts` |
| `setup:admin` | auth setup | — | `**/setup/admin.setup.ts` |
| `seeker` | spec runner | `setup:seeker` | `**/seeker/**/*.spec.ts` |
| `employer` | spec runner | `setup:employer` | `**/employer/**/*.spec.ts` |
| `admin` | spec runner | `setup:admin` | `**/admin/**/*.spec.ts` |
| `auth` | spec runner | — | `**/auth/**/*.spec.ts` |
| `public` | spec runner | — | `**/public/**/*.spec.ts` |
| `anon` | spec runner | — | `**/anon/**/*.spec.ts` |
| `api` | spec runner | — | `**/api/**/*.spec.ts` |

Config: `workers: 1`, `fullyParallel: false`, `actionTimeout: 15_000`, `navigationTimeout: 20_000`.

### 1.2 Test Credentials

| Role | Email | Password | Notes |
|---|---|---|---|
| Seeker | `playwright@gmail.com` | `jhankar123` | `auth_provider=credentials`, `onboarding_completed=false` |
| Employer | `employer_1@seed.fitvector.dev` | `jhankar123` | Company pre-seeded, `onboarding_completed=true`, `company_members.role=admin` |
| Admin | `superadmin@seed.fitvector.dev` | `jhankar123` | `role=admin`, bypasses Recruiter tab |

Plus **per-tier seeker accounts** for plan-gating tests:
- `playwright+free@gmail.com` (`plan_tier=free`)
- `playwright+starter@gmail.com` (`plan_tier=starter`)
- `playwright+pro@gmail.com` (`plan_tier=pro`)
- `playwright+elite@gmail.com` (`plan_tier=elite`)

### 1.3 DB State Strategy (Hybrid / Option C)

- **Persistent seed records** — used for all read/view tests. Never mutated by tests.
- **Ephemeral records** — created in `beforeAll`, hard-deleted in `afterAll`. All ephemeral string fields prefixed `test_playwright_` (e.g., company name `test_playwright_Acme`) so stale records from crashed runs are identifiable and purgeable.
- **Route mocks** (`page.route()`) — AI endpoints, third-party services, email delivery. Never hit real Resend/JDoodle/Python services from E2E.
- **Plan-gating manipulation** — direct DB writes via service-role key to bump usage counters in `usage_logs` (or whichever table holds the per-month counter — verify location during W1 infra week).

### 1.4 `planGatingFixture()` Factory

For each of the **6 real quota features**, factory generates **5 boundary tests** (4 boundary + 1 daily-reset):

```
planGatingFixture(feature, tier, quota) →
  ✅ under quota: action succeeds
  ✅ at quota - 1: action succeeds (last allowed)
  ❌ at quota: action returns 402 + { upgrade: true }
  ✅ after upgrade: action succeeds
  ✅ counter resets after 24 hours: backdate timestamp by 25h, action succeeds again
```

For the **3 boolean feature flags** (`job_alerts`, `chrome_extension`, plus `resume_templates` array gating), factory generates 2 tests per tier transition:

```
featureFlagFixture(feature, tier) →
  ❌ tier without feature: UI is locked / shows upgrade CTA
  ✅ tier with feature: UI is accessible
```

### 1.5 Email Testing

`/api/test/email-sink` endpoint — only mounted when `NEXTAUTH_TEST_MODE=true`. Tests assert on subject, recipient, and template name. No real Resend calls in E2E.

### 1.6 Auth Environment Flag

`NEXTAUTH_TEST_MODE=true` enables: email-sink, fixed OTP `000000`, captured reset links. Set via `.env.test` loaded by `playwright.config.ts`.

---

## 2. Folder Structure

```
apps/web/tests/
├── playwright.config.ts
└── e2e/
    ├── MASTER_PLAN.md                ← this file
    ├── .auth/.gitignore              ← *.json
    ├── setup/
    │   ├── seeker.setup.ts           ← exists ✅
    │   ├── employer.setup.ts         ← exists ✅
    │   └── admin.setup.ts            ← exists ✅
    │
    ├── support/
    │   ├── fixtures/
    │   │   ├── index.ts
    │   │   ├── db-fixture.ts         ← Supabase service-role client
    │   │   ├── plan-fixture.ts       ← planGatingFixture + featureFlagFixture
    │   │   └── mock-fixture.ts       ← page.route() helpers
    │   ├── page-objects/
    │   │   ├── seeker/{onboarding,dashboard,job-board,resume,outreach,tracker,community}.page.ts
    │   │   ├── employer/{job-post,pipeline,team,talent-pool,branding,scheduling}.page.ts
    │   │   └── admin/{user-table,moderation}.page.ts
    │   ├── mocks/
    │   │   ├── ai-responses.ts       ← MOCK_PARSE_RESUME, MOCK_TAILOR, MOCK_SCREEN, MOCK_GRADE, MOCK_INTERVIEW_NEXT_QUESTION, MOCK_COLD_EMAIL, MOCK_LINKEDIN_MSG, MOCK_REFERRAL_MSG, MOCK_GAP_ANALYSIS, MOCK_GENERATE_QUESTIONS, MOCK_JOB_DESCRIPTION
    │   │   ├── code-execute.ts       ← mock JDoodle responses
    │   │   ├── storage.ts            ← mock S3 presigned URLs
    │   │   └── email.ts              ← mock Resend payloads
    │   └── helpers/
    │       ├── db.ts                 ← direct Supabase admin queries
    │       ├── usage.ts              ← bump/reset usage counters
    │       ├── auth.ts               ← shared CSRF+session-verify
    │       └── token.ts              ← issue assessment/interview tokens for anon flows
    │
    ├── auth/                         ← 12 specs
    ├── public/                       ← 3 specs (landing, pricing, seo-meta)
    ├── anon/                         ← 4 specs (token-gated, no session)
    ├── seeker/                       ← 54 specs
    ├── employer/                     ← 62 specs
    ├── admin/                        ← 16 specs
    └── api/                          ← 11 specs
```

---

## 3. Support Layer

### 3.1 `support/mocks/ai-responses.ts` (canonical mocks)

| Export | Used by API |
|---|---|
| `MOCK_PARSE_RESUME_RESPONSE` | `/api/ai/parse-resume` |
| `MOCK_TAILOR_RESUME_RESPONSE` | `/api/ai/tailor-resume` |
| `MOCK_COLD_EMAIL_RESPONSE` | `/api/ai/cold-email` |
| `MOCK_LINKEDIN_MSG_RESPONSE` | `/api/ai/linkedin-msg` |
| `MOCK_REFERRAL_MSG_RESPONSE` | `/api/ai/referral-msg` |
| `MOCK_JOB_DESCRIPTION_RESPONSE` | `/api/ai/job-description` |
| `MOCK_GAP_ANALYSIS_RESPONSE` | `/api/jobs/gap-analysis` |
| `MOCK_SCREEN_CANDIDATE_RESPONSE` | `/api/employer/applicants/[id]/screen` |
| `MOCK_GENERATE_QUESTIONS_RESPONSE` | `/api/employer/assessments/generate-questions` |
| `MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE` | `/api/interview/[token]/message` |
| `MOCK_GRADE_ASSESSMENT_RESPONSE` | `/api/assessment/[token]/submit` |
| `MOCK_ONBOARDING_COMPLETE_RESPONSE` | `/api/user/onboarding` |

### 3.2 `support/helpers/usage.ts`

```typescript
setUsageCounter(userId, feature, value)              // direct DB write, bypass API
resetUsageCounter(userId, feature)
getUsageCounter(userId, feature)
setPlanTier(userId, tier)                            // 'free' | 'starter' | 'pro' | 'elite'
backdateUsageTimestamp(userId, feature, hoursAgo)    // shifts created_at/updated_at to test 24h reset window
```

### 3.3 `support/helpers/token.ts` (anon flows)

```typescript
issueAssessmentToken(candidateEmail, jobId, expiresInDays = 7)  // returns raw token URL
issueInterviewToken(candidateEmail, jobId, expiresInHours = 72)
issuePasswordResetToken(userId, expiresInSeconds = 3600)
```

---

## 4. Plan-Gating Reality Map

### Verified via `code-review-graph callers_of(hasQuota)` — **6 endpoints only**

| Feature | API endpoint | Free | Starter | Pro | Elite | Test file |
|---|---|---|---|---|---|---|
| `job_search` | `GET /api/jobs/search` | 3 | 10 | -1 | -1 | `seeker/plan-gating/job-search-quota.spec.ts` |
| `resume_tailor` | `POST /api/ai/tailor-resume` | 2 | 10 | 50 | -1 | `seeker/plan-gating/resume-tailor-quota.spec.ts` |
| `cold_email` | `POST /api/ai/cold-email` | 2 | 15 | 50 | -1 | `seeker/plan-gating/cold-email-quota.spec.ts` |
| `linkedin_msg` | `POST /api/ai/linkedin-msg` | 2 | 15 | 50 | -1 | `seeker/plan-gating/linkedin-msg-quota.spec.ts` |
| `referral_msg` | `POST /api/ai/referral-msg` | 0 | 5 | 30 | -1 | `seeker/plan-gating/referral-msg-quota.spec.ts` |
| `active_applications` | `POST /api/tracker` | 10 | 50 | -1 | -1 | `seeker/plan-gating/active-applications-quota.spec.ts` |

> `-1` = unlimited. Values from `packages/shared/src/constants/plan-limits.ts`.

### Frontend feature-flag gating (NOT enforced server-side as quota)

| Feature | Free | Starter | Pro | Elite | Where enforced | Test file |
|---|---|---|---|---|---|---|
| `job_alerts` (bool) | ❌ | ✅ | ✅ | ✅ | UI gate on `/dashboard/settings/notifications` job-alert section | `seeker/plan-gating/job-alerts-flag.spec.ts` |
| `chrome_extension` (bool) | ❌ | ❌ | ✅ | ✅ | UI gate in plan settings page | `seeker/plan-gating/chrome-extension-flag.spec.ts` |
| `resume_templates` (array) | `[modern]` | `[modern,classic]` | `+minimal` | `+custom` | UI gate in resume builder template picker | `seeker/plan-gating/resume-templates-flag.spec.ts` |

### Documented tech debt — NOT gated server-side (specs written as `test.fixme()`)

These features exist in `plan-limits.ts` but have **NO `hasQuota` enforcement** in any route as of 2026-04-30. **Decision (locked):** write specs as full quota boundary tests, but mark each with `test.fixme()` so they're listed in the Playwright report as documented tech debt. When backend enforcement lands, remove the `.fixme` and they light up green.

| Feature | Free | Starter | Pro | Elite | Future API endpoint | Test file (fixme) |
|---|---|---|---|---|---|---|
| `gap_analysis` | 0 | 0 | 20 | -1 | `POST /api/jobs/gap-analysis` | `seeker/plan-gating/gap-analysis-quota.spec.ts` |
| `email_find` | 0 | 0 | 20 | 100 | TBD (no route exists yet) | `seeker/plan-gating/email-find-quota.spec.ts` |
| `resume_history` | 2 | 5 | -1 | -1 | `GET /api/user/resumes` (cap query) | `seeker/plan-gating/resume-history-quota.spec.ts` |
| `followup_reminders` | 0 | 3 | -1 | -1 | TBD | `seeker/plan-gating/followup-reminders-quota.spec.ts` |
| `jobs_per_search` | 5 | 25 | -1 | -1 | UI cap today; backend truncation TBD | UI live: `seeker/jobs/search-result-cap.spec.ts`; Backend fixme: `seeker/plan-gating/jobs-per-search-quota.spec.ts` |

---

## 5. RBAC Reality Map

### Verified via `code-review-graph callers_of(requireRole)` — **4 endpoints only**

| Endpoint | Required role(s) | Test file |
|---|---|---|
| `PUT /api/employer/branding` | `admin` or `recruiter` | `employer/team/rbac-branding.spec.ts` |
| `PUT /api/employer/company` | `admin` | `employer/team/rbac-company-update.spec.ts` |
| `POST /api/employer/company/members` | `admin` | `employer/team/rbac-invite-member.spec.ts` |
| `PUT /api/employer/company/members/[id]` | `admin` | `employer/team/rbac-change-role.spec.ts` |

### IMPORTANT: All other employer endpoints have NO role check

`getEmployerSession()` only verifies company membership exists — it does NOT check the role tier. This means **any company member (including viewer) can currently call**:

- All applicant action endpoints (`stage`, `reject`, `screen`, `vote`, `notes`, `invite-interview`, `schedule`)
- All job CRUD (`POST/PUT/DELETE /api/employer/jobs/*`)
- All assessment CRUD
- All scheduling/interview endpoints
- Bulk `screen-all` and `duplicate`

> **Test approach:** Write the 4 confirmed RBAC specs above with full boundary tests. For all other endpoints, write **observational** specs that document current behavior (e.g., `viewer can currently delete jobs — flag as pending RBAC implementation`). These act as regression tests if RBAC is added later. Tracked under `employer/team/rbac-gaps.spec.ts`.

---

## 6. Rate-Limiter Reality Map

### Verified by reading `apps/web/src/middleware.ts`

| Limiter | Path pattern | Limit | Key | Test file |
|---|---|---|---|---|
| `signup` | `/api/auth/signup`, `/api/auth/signup/employer` | 5 / 60s | `ip:<client-ip>` | `api/rate-limiting/signup-rate-limit.spec.ts` |
| `ai` | `/api/ai/**` | 10 / 60s | `session` if auth, else `ip` | `api/rate-limiting/ai-rate-limit.spec.ts` |
| `codeExecute` | `/api/code/execute` | 20 / 60s | `ip` | `api/rate-limiting/code-execute-rate-limit.spec.ts` |
| `assessmentSubmit` | `/api/assessment/[token]/submit` | 3 / 600s | `token:<token>` | `api/rate-limiting/assessment-submit-rate-limit.spec.ts` |
| `employer` | `/api/employer/**` | 100 / 60s | `session` if auth, else `ip` | `api/rate-limiting/employer-rate-limit.spec.ts` |
| `general` | `/api/**` (catch-all) | 200 / 60s | `ip` | covered by other limiter tests |

**Fail-open policy:** If Upstash Redis is unreachable, requests pass through. Tested in `signup-rate-limit.spec.ts`.

**Response shape on 429:**
```json
{ "error": "Too many requests. Please slow down and try again." }
```
Headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## 7. Test Inventory — Auth

12 spec files.

### `auth/seeker-login.spec.ts` (5)
- ✅ valid credentials → `/dashboard`
- ✅ `onboarding_completed=false` → redirected to `/onboarding`
- ✅ `onboarding_completed=true` → lands on `/dashboard`
- ❌ wrong password → "Invalid email or password"
- ❌ unknown email → same generic error (no enumeration)

### `auth/employer-login.spec.ts` (4)
- ✅ valid credentials via Recruiter tab → `/employer` or `/employer/onboarding`
- ✅ first-login (no company) → `/employer/onboarding`
- ❌ wrong password on Recruiter tab → error
- ❌ seeker creds on Recruiter tab → role-mismatch error

### `auth/admin-login.spec.ts` (3)
- ✅ superadmin login → `/admin`
- ✅ session contains `role=admin`
- ❌ non-admin accessing `/admin` → redirect

### `auth/invalid-credentials.spec.ts` (4)
- ❌ SQL-injection payload safely rejected
- ❌ empty fields → inline validation
- ❌ role mismatch (seeker on Recruiter, employer on Job Seeker)
- ❌ `auth_provider=google` account rejected on credentials form

### `auth/seeker-signup.spec.ts` (5)
- ✅ valid signup → 201, then redirect to `/onboarding` after auto sign-in
- ✅ DB row has `auth_provider=credentials`, `role=seeker`, `plan_tier=free`, `status=onboarding`
- ✅ password is bcrypt-hashed (cost 10)
- ❌ duplicate email (seeker) → 409 "An account with this email already exists"
- ❌ duplicate email registered as employer → 409 "registered as a recruiter account"

### `auth/employer-signup.spec.ts` (4)
- ✅ valid signup via `/api/auth/signup/employer` → 201, role=employer
- ✅ post-signup redirect to `/employer/onboarding` (not `/onboarding`)
- ❌ duplicate email registered as seeker → 409 "registered as a job seeker account"
- ❌ duplicate email (same role) → generic 409

### `auth/signup-validation.spec.ts` (5)
- ❌ password < 8 chars → 400
- ❌ invalid email format → 400
- ❌ confirm-password mismatch → inline error
- ❌ empty required fields → inline errors
- ❌ XSS payload in name field is escaped

### `auth/password-reset-request.spec.ts` (5)
- ✅ valid email → 200 + email captured by sink
- ✅ unknown email → same 200 (no enumeration)
- ✅ DB row in `password_reset_tokens` with hashed token (not raw)
- ❌ 4th request in 15min for same user → silently no email sent (soft DB count rate-limit)
- ✅ token URL contains `/reset-password?token=<raw>`

### `auth/password-reset-confirm.spec.ts` (5)
- ✅ valid token + new password → 200, login with new password works
- ❌ already-used token (replay) → 400 "already been used"
- ❌ expired token (set `expires_at < now()` via DB helper) → 400 "has expired"
- ❌ malformed token → 400 "invalid"
- ❌ password < 8 chars → 400

### `auth/google-oauth-redirect.spec.ts` (2)
- ✅ "Continue with Google" → `accounts.google.com` URL
- ✅ callback URL contains correct `callbackUrl` param

### `auth/session-cookies.spec.ts` (3)
- ✅ session cookie has `HttpOnly`, `Secure` (in https), `SameSite=Lax`
- ✅ cookie name is `authjs.session-token` or `__Secure-authjs.session-token`
- ❌ tampered JWT → re-auth required

### `auth/session-expiry.spec.ts` (3)
- ✅ valid session → protected route 200
- ❌ expired session → redirect to `/login`
- ✅ logout clears cookie

---

## 8. Test Inventory — Public

3 spec files.

### `public/landing.spec.ts` (5)
- ✅ hero, features, footer render
- ✅ "Get Started" CTA → `/signup`
- ✅ "Sign In" → `/login`
- ✅ no console errors
- ✅ basic axe accessibility check (no critical violations)

### `public/pricing.spec.ts` (6)
- ✅ all 4 tiers render (Free, Starter, Pro, Elite)
- ✅ free tier shows ₹0 / "Free"
- ✅ each paid tier shows monthly price
- ✅ "Get Started" on free → `/signup`
- ✅ "Upgrade" on paid → checkout (or signup if not authed)
- ✅ feature comparison table reflects `plan-limits.ts` (verify against shared constants)

### `public/seo-meta.spec.ts` (4)
- ✅ landing `<title>` correct
- ✅ landing has `og:title` meta
- ✅ pricing has canonical URL
- ✅ `/login` has `noindex` (if configured)

---

## 9. Test Inventory — Anonymous Token Flows

4 spec files. All tests run **without authentication** — token-gated.

### `anon/assessment-take.spec.ts` (8)
Token issued via `support/helpers/token.ts::issueAssessmentToken()`.
- ✅ GET `/api/assessment/[token]` returns assessment data with `correctAnswer` stripped from questions
- ✅ POST `/api/assessment/[token]/start` transitions `invited → started`
- ✅ POST `/api/code/execute` runs visible test cases only (no `expectedOutput` in response)
- ✅ POST `/api/assessment/[token]/event` accumulates `tabSwitches` and `copyPasteAttempts` server-side
- ✅ submit before time-limit + 2min grace → `wasLate=false`
- ✅ submit after grace → `wasLate=true`, `lateByMinutes` calculated
- ❌ access expired token (`expires_at < now()` or `invited_at + 7d < now()`) → 410 "expired"
- ❌ submit when `status=submitted` → 400 "already completed"

### `anon/assessment-anti-cheat.spec.ts` (4)
- ✅ ≥3 tab switches → submission flagged for manual review
- ✅ ≥2 copy-paste attempts → submission flagged
- ✅ submitted late → flagged
- ✅ flagged submission visible to employer in results page with warning badge

### `anon/public-interview.spec.ts` (8)
Token issued via `issueInterviewToken()`.
- ✅ GET `/api/interview/[token]` returns interview metadata
- ✅ POST `/api/interview/[token]/start` is idempotent (resume allowed)
- ✅ POST `/api/interview/[token]/message` returns `nextQuestion` for turns 1-6
- ✅ turn 7 returns `isComplete=true`
- ❌ message after `isComplete` → error
- ❌ expired token → 410
- ✅ Python service down → fallback question returned (no 503)
- ✅ transcript persisted incrementally to DB after each turn

### `anon/public-job-apply.spec.ts` (6)
NB: `/api/apply/fitvector/[jobPostId]` requires `auth()` — NOT public-anonymous. Spec runs in `seeker` project but tests the apply endpoint contract directly.
- ✅ authenticated seeker apply with `resumeId` + screening → 201, `applicantId` returned
- ✅ creates row in both `applicants` (pipeline_stage=applied) and `fitvector_applications`
- ❌ second apply same job → 409 "already applied"
- ❌ no session → 401
- ❌ invalid `resumeId` UUID → 400 "Invalid resume ID"
- ❌ non-existent job → 404

---

## 10. Test Inventory — Seeker

54 spec files.

### Onboarding (3)
- `seeker/onboarding/onboarding.spec.ts` ← **EXISTS ✅** (2 tests)
- `seeker/onboarding/onboarding-redirect.spec.ts` (3): `false` redirected, `true` allowed, completion writes DB
- `seeker/onboarding/resume-parse-error.spec.ts` (3): parse 503 fallback, malformed PDF, oversize PDF

### Dashboard (3)
- `seeker/dashboard/dashboard-load.spec.ts` (4): page loads, greeting name, "Jobs for You", skeleton
- `seeker/dashboard/dashboard-stats.spec.ts` (4): app status count, saved-jobs count, resume strength widget, recent activity
- `seeker/dashboard/dashboard-empty.spec.ts` (3): brand-new user empty state, zero applications, zero saved jobs

### Jobs (6)
- `seeker/jobs/browse.spec.ts` (4): list renders, card content, pagination, empty state
- `seeker/jobs/search-filter.spec.ts` (6): keyword, location, type, exp-level, salary, clear-all
- `seeker/jobs/job-detail.spec.ts` (4): open detail, full content, save button, apply button
- `seeker/jobs/save-job.spec.ts` (3): save, unsave, persists after reload
- `seeker/jobs/apply-modal.spec.ts` (5): apply with pre-filled resume, screening questions answer, success toast, applicant created in DB, "Applied" button state
- `seeker/jobs/applications-list.spec.ts` (4): list renders, status badge, sort by date, empty state

### Resume (3)
- `seeker/resume/upload-and-parse.spec.ts` (5): PDF upload triggers parse (mock), extracted skills/exp/edu render, success banner, non-PDF rejected, oversize rejected
- `seeker/resume/parse-result-edit.spec.ts` (4): edit summary, edit experience entry, edit skills, save persists
- `seeker/resume/tailor-resume.spec.ts` (5): tailor for specific job, mock /api/ai/tailor-resume returns tailored, download tailored PDF, edit before download, history saved

### Outreach (4) — **NEW vs v1**
Page: `/dashboard/outreach`. APIs: `/api/outreach`, `/api/ai/cold-email`, `/api/ai/linkedin-msg`, `/api/ai/referral-msg`.
- `seeker/outreach/cold-email-generate.spec.ts` (4): generate with tone (professional/conversational/confident), result rendered, copy-to-clipboard, history row created
- `seeker/outreach/linkedin-msg-generate.spec.ts` (3): generate, result rendered, copy
- `seeker/outreach/referral-msg-generate.spec.ts` (3): generate (Pro+ only — Free has 0 quota), result rendered, copy
- `seeker/outreach/history-management.spec.ts` (5): list paginated, expand/collapse older versions, delete single, "Load more", grouped-by-job display

### Tracker (4) — **NEW vs v1**
Page: `/dashboard/tracker`. APIs: `/api/tracker`. Plan-gated on `active_applications`.
- `seeker/tracker/applied-tab.spec.ts` (3): "Applied via FitVector" tab shows only `fitvectorStatus != null`, status badges, sort by date
- `seeker/tracker/personal-kanban.spec.ts` (5): kanban renders 7 columns, drag card between columns updates `status`, persists after reload, edit card opens modal, delete card removes
- `seeker/tracker/manual-add.spec.ts` (4): "Add manually" form, required fields validate, new card appears in `saved` column, plan-limit check (active_applications)
- `seeker/tracker/filters.spec.ts` (4): search by company, filter by status, date-range filter (7/30/90/all), clear-all

### Tests/Skill-Assessments (3)
Page: `/dashboard/tests`. APIs: `/api/user/tests`.
- `seeker/tests/list-pending.spec.ts` (4): pending tab renders, status badges (Invited/In Progress), time limit shown, "Take Test" → `/assessments/take/[id]`
- `seeker/tests/list-completed.spec.ts` (4): completed tab, score + Pass/Fail badge, "View Results" button, sorted by date
- `seeker/tests/empty-states.spec.ts` (2): no pending tests, no completed tests

### Mock Interviews (3) — **NEW vs v1**
Page: `/dashboard/interviews/[id]`. APIs: `/api/seeker/interviews/[id]`.
- `seeker/interviews/report-load.spec.ts` (5): summary, strengths, areas-to-develop, skill ratings (1-5 stars), communication card
- `seeker/interviews/transcript.spec.ts` (3): collapsible transcript, AI/You speaker labels, timestamps
- `seeker/interviews/error-states.spec.ts` (2): missing report (404) shows alert, back button works

### Schedule (3) — **NEW vs v1**
Page: `/dashboard/schedule`. APIs: `/api/user/calendar/events`.
- `seeker/schedule/calendar-connected.spec.ts` (5): events grouped by Today/Tomorrow/weekday, time format `2:30 PM – 3:00 PM · 30 min`, "Video call" badge, all-day events show "All day", click "Join Call"
- `seeker/schedule/calendar-not-connected.spec.ts` (2): "Google Calendar not connected" + link to settings
- `seeker/schedule/empty-state.spec.ts` (1): no events in next 30 days

### Community (4) — **NEW vs v1**
Pages: `/dashboard/community`, `/discussions`, `/interviews`, `/salaries`. APIs: `/api/community`, `/api/community/[id]`, `/api/community/[id]/comments`, `/api/community/vote`.
- `seeker/community/hub.spec.ts` (3): quick-stats render, three cards link to sub-pages, beta badge
- `seeker/community/discussions.spec.ts` (7): list renders, category filter (all/tech/career/salary/misc), sort (hot/new/top), upvote/downvote, expand thread, reply (anonymous toggle), create new
- `seeker/community/interviews.spec.ts` (7): list, search by company/role, filter difficulty (easy/medium/hard), filter outcome (rejected/in_progress/offer), sort, expand for rounds/process/tips, share-experience modal
- `seeker/community/salaries.spec.ts` (2): static table renders 15+ roles, locations columns (Bangalore/Mumbai/Remote)

### Companies (2) — **NEW vs v1**
Pages: `/dashboard/companies`, `/dashboard/companies/[id]`. APIs: `/api/companies/search`, `/api/companies/[id]`.
- `seeker/companies/browse.spec.ts` (5): search by name/industry/desc, paginate (Load more), Clear search, click → detail, empty state
- `seeker/companies/detail.spec.ts` (4): logo/name/industry/desc, locations, culture keywords, active jobs grid + Apply via FitVector

### Analytics (1) — **NEW vs v1**
- `seeker/analytics/seeker-analytics.spec.ts` (5): 4 stat cards, response-rate calc, this-week count, status pipeline bars, empty state with 0 apps

### Profile (4)
- `seeker/profile/basic-info.spec.ts` (4): load, edit name, edit email, validation
- `seeker/profile/skills.spec.ts` (4): list, add, remove, persist
- `seeker/profile/experience.spec.ts` (4): list, add, edit, delete
- `seeker/profile/education.spec.ts` (4): list, add, edit, delete

### Alerts (2)
- `seeker/alerts/create-alert.spec.ts` (4): Pro/Elite create alert, validation, list update, Free shows upgrade CTA
- `seeker/alerts/manage-alerts.spec.ts` (3): list, toggle off, delete

### Plan-Gating (10) — **rebuilt against real enforcement**

**Quota tests (6 — all use `planGatingFixture()`):**
- `seeker/plan-gating/job-search-quota.spec.ts` (4): under/at-1/at/after-upgrade for `job_search` (3/10/-1/-1)
- `seeker/plan-gating/resume-tailor-quota.spec.ts` (4): for `resume_tailor` (2/10/50/-1)
- `seeker/plan-gating/cold-email-quota.spec.ts` (4): for `cold_email` (2/15/50/-1)
- `seeker/plan-gating/linkedin-msg-quota.spec.ts` (4): for `linkedin_msg` (2/15/50/-1)
- `seeker/plan-gating/referral-msg-quota.spec.ts` (4): for `referral_msg` (0/5/30/-1) — Free is hard-blocked
- `seeker/plan-gating/active-applications-quota.spec.ts` (4): for `active_applications` (10/50/-1/-1)

**Feature-flag tests (3 — use `featureFlagFixture()`):**
- `seeker/plan-gating/job-alerts-flag.spec.ts` (4): Free locked / Starter+ unlocked, UI shows upgrade CTA on Free
- `seeker/plan-gating/chrome-extension-flag.spec.ts` (4): Free/Starter locked / Pro+ unlocked
- `seeker/plan-gating/resume-templates-flag.spec.ts` (4): template picker shows correct subset per tier (1/2/3/4 templates)

**Upgrade modal (1):**
- `seeker/plan-gating/upgrade-modal.spec.ts` (4): renders comparison, current tier highlighted, "Upgrade to Pro" → checkout, dismiss closes

### Settings (4)
- `seeker/settings/account-settings.spec.ts` (5): name/email/phone/LinkedIn/portfolio update, work history add/edit/delete, skills add/remove
- `seeker/settings/notifications.spec.ts` (3): preferences toggle, save, persist
- `seeker/settings/verification.spec.ts` (4): four verification cards (identity/education/skills/background), upload document, status badges, "1 of 4 verified" updates
- `seeker/settings/plan.spec.ts` (3): current plan badge, feature comparison, upgrade button → checkout

### Notifications inbox (2)
- `seeker/notifications/inbox.spec.ts` (4): list renders, unread count badge, mark-as-read, delete
- `seeker/notifications/realtime.spec.ts` (2): new notification appears without reload (if implemented), badge count updates

---

## 11. Test Inventory — Employer

62 spec files.

### Onboarding (2)
- `employer/onboarding/company-setup.spec.ts` (5): company name/industry/size required, save creates company, sets `onboarding_completed=true`, redirect to `/employer`
- `employer/onboarding/onboarding-redirect.spec.ts` (2): incomplete → redirect, complete → free access

### Dashboard (2)
- `employer/dashboard/dashboard-load.spec.ts` (4): loads, company name in header, active-jobs count, recent applications
- `employer/dashboard/dashboard-stats.spec.ts` (3): total apps, pipeline distribution chart, time-to-hire metric

### Jobs (6)
- `employer/jobs/list.spec.ts` (4): all jobs, status filter (draft/active/closed), search by title, empty state
- `employer/jobs/create.spec.ts` (6): form validation, AI-assist generates description (mock `/api/ai/job-description`), save as draft, publish immediately, success toast, appears in list
- `employer/jobs/edit.spec.ts` (4): edit title, edit description, save persists, only `admin/recruiter` can edit (best-effort: no real check, observational)
- `employer/jobs/publish-unpublish.spec.ts` (4): draft → active, active → draft, public board reflects state, search-engine indexable when active
- `employer/jobs/delete.spec.ts` (3): confirm dialog, delete removes, only allowed for empty pipeline (verify behavior)
- `employer/jobs/duplicate.spec.ts` (3): "Duplicate" creates new draft via `/api/employer/jobs/[id]/duplicate`, fields copied, new ID

### Pipeline (8)
Page: `/employer/jobs/[id]/pipeline`. APIs: `/api/employer/applicants/*`.
- `employer/pipeline/kanban-view.spec.ts` (5): 10 columns render (applied/ai_screened/assessment_pending/assessment_completed/ai_interview_pending/ai_interviewed/human_interview/offer/hired/rejected), top-border colors, candidate cards show name+score, drag between columns, persists
- `employer/pipeline/list-view.spec.ts` (3): table renders, sort by score, filter by stage
- `employer/pipeline/candidate-drawer.spec.ts` (5): click card opens drawer, shows resume link/timeline/notes, add note via `/api/employer/applicants/[id]/notes`, note persists, close drawer
- `employer/pipeline/stage-move.spec.ts` (3): advance via UI calls `/api/employer/applicants/[id]/stage`, optimistic update, rollback on error
- `employer/pipeline/reject.spec.ts` (3): reject via `/api/employer/applicants/[id]/reject`, confirm dialog, removes from kanban
- `employer/pipeline/ai-screen-single.spec.ts` (4): "Run AI screening" calls `/api/employer/applicants/[id]/screen` (mocked), score + screening_bucket displayed, breakdown modal, viewer cannot trigger (observational)
- `employer/pipeline/ai-screen-bulk.spec.ts` (4): "AI Screen All" calls `/api/employer/jobs/[id]/screen-all`, progress indicator, all candidates updated, error handling
- `employer/pipeline/vote.spec.ts` (3): hiring manager vote via `/api/employer/applicants/[id]/vote`, vote tally renders, change vote

### Candidates (cross-job) (2)
- `employer/candidates/list.spec.ts` (5): all-candidates table, search name/email/role, score filter (All/80+/60-80/<60), bucket filter (Strong/Good/Review/NotFit), pagination
- `employer/candidates/detail.spec.ts` (3): clicking row opens modal, shows full applicant detail, link to pipeline view

### Talent Pool (4) — **NEW vs v1**
Page: `/employer/talent-pool`. APIs: `/api/employer/talent-pool`, `/search`, `/[id]/tags`, `/[id]/reengage`.
- `employer/talent-pool/list-and-filters.spec.ts` (5): list renders with badge count, search by name/email/skills, score filter buttons, tag filters, clear-all
- `employer/talent-pool/find-matches.spec.ts` (5): job-post dropdown, max-candidates input (1-100), last-active date, skills CSV, location, "Find Matches" populates table with match-% badges
- `employer/talent-pool/tags.spec.ts` (4): inline "+ tag" with autofocus, Enter confirms, Escape cancels, tag color is hash-based
- `employer/talent-pool/reengage.spec.ts` (4): modal pre-fills subject+body with candidate name, send calls `/api/employer/talent-pool/[id]/reengage`, email captured by sink, success toast

### Assessments (5)
- `employer/assessments/list.spec.ts` (3): assessments list, search by title, archive action
- `employer/assessments/create.spec.ts` (5): manual question add (MCQ/short/coding), AI-generate via `/api/employer/assessments/generate-questions` (mock), validate question count, save → 201, appears in list
- `employer/assessments/edit.spec.ts` (3): edit title and questions, persists, no role gate (observational)
- `employer/assessments/assign.spec.ts` (4): assign to candidate via `/api/employer/assessments/[id]/assign`, invitation email captured, candidate appears in pending, reinvite via `/reinvite`
- `employer/assessments/results.spec.ts` (5): results list, click row, show candidate answers + auto-score, manual grade override via `/api/employer/submissions/[id]/grade`, anti-cheat warning badge

### AI Interviews (employer-side) (3) — **NEW vs v1**
Page: `/employer/interviews`, `/employer/interviews/panels`, `/employer/interviews/compare`, `/employer/interviews/[id]`.
- `employer/interviews/list.spec.ts` (4): tabs (All/Pending/Completed/Flagged), stats compute correctly, status icons, empty per tab
- `employer/interviews/invite-and-resend.spec.ts` (3): invite via `/api/employer/applicants/[id]/invite-interview`, status `invited`, resend updates `invite_sent_at`
- `employer/interviews/detail-and-flagged.spec.ts` (4): score 0-10, cheating-risk badge (low/medium/high), transcript, view by token

### Interview Panels & Compare (2) — **NEW vs v1**
- `employer/panels/manage-panels.spec.ts` (4): create panel via `/api/employer/interviews/panels`, add interviewers, edit, delete
- `employer/panels/compare-candidates.spec.ts` (3): `/employer/interviews/compare` side-by-side scores, calibration, recommendation

### Scheduling (3) — **NEW vs v1**
Page: `/employer/scheduling`. APIs: `/api/employer/scheduling*`.
- `employer/scheduling/week-view.spec.ts` (4): 7-day calendar, time grid 8am-6pm, prev/next week, interview blocks render type icon+status
- `employer/scheduling/create-and-reschedule.spec.ts` (4): click slot opens modal, candidate/interviewer/type selectors, save creates row, drag block reschedules (or PUT)
- `employer/scheduling/feedback.spec.ts` (3): feedback form (notes + 1-5 rating), submit via `/api/employer/scheduling/[id]/feedback`, persisted

### Branding (3) — **NEW vs v1**
Page: `/employer/branding`. API: `/api/employer/branding`. **RBAC: requires admin or recruiter**.
- `employer/branding/edit-tab.spec.ts` (5): banner upload, story textarea, team photos grid, benefits add/remove, culture values icon+title+description
- `employer/branding/preview-tab.spec.ts` (2): preview shows entered content as public page
- `employer/branding/day-in-the-life.spec.ts` (3): per-active-job entry, "Add for another role" only when remaining jobs, save persists

### Promotions (1) — **NEW vs v1**
Page: `/employer/promotions`. API: `/api/employer/promotions`.
- `employer/promotions/list.spec.ts` (5): stat cards (spend/impressions/apps), table CTR calc, status badge colors, empty state, "Boost a Job" → `/employer/jobs`

### Analytics (5) — **NEW vs v1**
Page: `/employer/analytics`. APIs: `/api/employer/analytics`, `/funnel`, `/sources`, `/jobs`, `/trend`, `/interviewers`.
- `employer/analytics/overview.spec.ts` (5): 6 stat cards, range buttons (7/30/90), trend % indicators, CSV export, mobile single-column
- `employer/analytics/funnel.spec.ts` (3): bar scaling, conversion %, empty when 0 candidates
- `employer/analytics/sources.spec.ts` (3): dual-axis chart (count + avg score), source list, percentages sum 100%
- `employer/analytics/jobs-table.spec.ts` (3): per-job rows with screen %/interview %, sortable, empty
- `employer/analytics/interviewers-table.spec.ts` (3): feedback time, calibration score, empty when no completed interviews

### Company Profile (2)
- `employer/company/profile.spec.ts` (4): editable name/desc, **RBAC: only admin can save** (PUT `/api/employer/company`), public profile at `/companies/[slug]`, public preview link
- `employer/company/logo-upload.spec.ts` (3): upload (mocked S3), preview, non-image rejected

### Team (5) — **rebuilt to match RBAC reality**
- `employer/team/list.spec.ts` (3): all members, role badges, joined date
- `employer/team/rbac-invite-member.spec.ts` (4): **admin can invite via POST `/api/employer/company/members`** (mock email sink), non-admin gets 403, pending status, invite link in email
- `employer/team/rbac-change-role.spec.ts` (5): admin promotes recruiter → admin via PUT `/[id]`, non-admin gets 403, can't change own role (safeguard), reflected in list, last admin can't be demoted (verify behavior)
- `employer/team/rbac-branding.spec.ts` (3): admin or recruiter can PUT `/api/employer/branding`, hiring_manager/viewer get 403, response status verified
- `employer/team/rbac-gaps.spec.ts` (5): **observational** — viewer can currently call applicant `stage`/`reject`/`screen` and job CRUD; documents current gap. Acts as regression test if RBAC added later.

### Settings (2)
- `employer/settings/general.spec.ts` (4): company name (admin only — PUT `/api/employer/company`), website, description, theme toggle
- `employer/settings/billing.spec.ts` (4): current plan badge, usage summary, upgrade button → checkout, plan matches DB tier

### Question Bank (1) — **NEW vs v1**
- `employer/question-bank/manage.spec.ts` (4): list saved questions, add new, tag, delete

---

## 12. Test Inventory — Admin

16 spec files.

### Dashboard (1)
- `admin/dashboard/load.spec.ts` (4): total users, total companies, total jobs, recent activity

### Users (4)
- `admin/users/list.spec.ts` (4): all users, search by email, filter by role, pagination
- `admin/users/detail.spec.ts` (4): email/role/plan/created_at, activity log, plan badge
- `admin/users/suspend.spec.ts` (4): suspend, suspended user can't login (verify error), reinstate, login works again
- `admin/users/change-role.spec.ts` (3): promote seeker → admin, reflected in detail, cannot demote self

### Companies (3)
- `admin/companies/list.spec.ts` (3): all companies, search by name, filter by verification
- `admin/companies/detail.spec.ts` (4): name/industry/members/jobs counts, active job list, members list, public profile preview
- `admin/companies/verify.spec.ts` (3): mark verified, verified badge on public profile, revoke

### Jobs Moderation (2)
- `admin/jobs/moderation.spec.ts` (4): all jobs cross-company, filter status (active/draft/flagged), search, view detail
- `admin/jobs/flag.spec.ts` (3): flag job, hidden from public board, unflag restores

### Plans (2)
- `admin/plans/list.spec.ts` (3): 4 tiers shown, feature limits visible, edit limit (if implemented)
- `admin/plans/assign.spec.ts` (4): assign different tier to user, reflected in user detail, downgrade enforces lower quota immediately on next API call, upgrade unlocks

### Assessments (1)
- `admin/assessments/global.spec.ts` (4): all assessments cross-company, search, archive, archived hidden from employer view

### Audit log (1)
- `admin/audit/audit-log.spec.ts` (3): admin actions logged (suspend/role change/plan assign), filter by actor, filter by action type

### Read-only protections (1)
- `admin/security/non-admin-blocked.spec.ts` (3): seeker accessing `/admin` → redirect, employer → redirect, direct API call → 403

### Stats endpoint (1)
- `admin/api/stats.spec.ts` (3): GET `/api/admin/stats` returns aggregate counts, 401 unauth, 403 non-admin

---

## 13. Test Inventory — API / Edge

11 spec files. These are direct API contract tests using `request.post()` — no UI.

### Rate limiting (5)
- `api/rate-limiting/signup-rate-limit.spec.ts` (4): 5 signups in 60s succeed, 6th returns 429 with `Retry-After`, fail-open when Redis unreachable, separate IPs are independent
- `api/rate-limiting/ai-rate-limit.spec.ts` (4): 10 AI calls succeed, 11th returns 429, session-keyed for authed users, IP-keyed when not authed
- `api/rate-limiting/code-execute-rate-limit.spec.ts` (3): 20 executions in 60s succeed, 21st returns 429, sliding window
- `api/rate-limiting/assessment-submit-rate-limit.spec.ts` (3): 3 submissions per token in 600s, 4th returns 429, different tokens independent
- `api/rate-limiting/employer-rate-limit.spec.ts` (2): 100 employer calls succeed, 101st returns 429

### Usage endpoint (1)
- `api/usage/usage-endpoint.spec.ts` (5): GET `/api/usage` returns 200 with all 6 quota counters, increments after tracked action, resets at month boundary (verify), 401 unauth, plan tier matches DB

### Middleware guards (3)
- `api/middleware/unauthenticated-redirect.spec.ts` (5): `/dashboard`, `/onboarding`, `/employer`, `/admin` redirect to `/login`; `/login` and `/signup` accessible
- `api/middleware/role-guard.spec.ts` (5): seeker→/employer 403, seeker→/admin 403, employer→/admin 403, employer→/employer 200, admin→/admin 200
- `api/middleware/csrf.spec.ts` (3): NextAuth CSRF token required for `/api/auth/callback/credentials`, missing token rejected, replay protection

### Health & infra (1)
- `api/health/health-endpoint.spec.ts` (2): GET `/api/health` returns 200 with status, includes DB/Redis check

### Webhook & integration (1)
- `api/integrations/calendar-callback.spec.ts` (3): `/api/calendar/google/callback` redirects, stores tokens, error states (denied/invalid_state)

---

## 14. 8-Week Phased Rollout

| Week | Theme | Specs | Tests |
|---|---|---|---|
| **W1** | Infrastructure | `support/` layer, fixtures, POMs, mocks, helpers, CI config (`.github/workflows/e2e.yml`), per-tier seeker accounts seeded | 0 specs / foundation |
| **W2** | Auth + Public + Anon | All `auth/` (12), `public/` (3), `anon/` (4) | ~83 |
| **W3** | Seeker — Onboarding/Dashboard/Jobs/Resume/Profile | 19 specs | ~75 |
| **W4** | Seeker — Outreach/Tracker/Community/Companies/Schedule/Tests/Interviews/Analytics/Notifications/Alerts/Settings | 25 specs | ~95 |
| **W5** | Seeker plan-gating + verification + final settings | 10 specs | ~38 |
| **W6** | Employer — Onboarding/Dashboard/Jobs/Pipeline/Candidates | 20 specs | ~75 |
| **W7** | Employer — Talent-Pool/Assessments/Interviews/Panels/Scheduling/Branding/Promotions/Analytics/Company/QuestionBank | 26 specs | ~100 |
| **W8** | Employer team+RBAC + Settings + Admin + API/Edge | 16 specs (employer rest) + 16 (admin) + 11 (api) = 43 | ~120+ |

**Totals:** 162 specs, ~470 tests.

---

## 15. Full Checklist

Tick each spec as it passes CI. Existing specs marked ✅.

### Infrastructure (Week 1) — 19 items
- [ ] `support/fixtures/index.ts`
- [ ] `support/fixtures/db-fixture.ts` (Supabase service-role)
- [ ] `support/fixtures/plan-fixture.ts` (planGatingFixture + featureFlagFixture)
- [ ] `support/fixtures/mock-fixture.ts`
- [ ] `support/page-objects/seeker/{onboarding,dashboard,job-board,resume,outreach,tracker,community}.page.ts` (7)
- [ ] `support/page-objects/employer/{job-post,pipeline,team,talent-pool,branding,scheduling}.page.ts` (6)
- [ ] `support/page-objects/admin/{user-table,moderation}.page.ts` (2)
- [ ] `support/mocks/ai-responses.ts` (12 canonical mocks)
- [ ] `support/mocks/code-execute.ts`
- [ ] `support/mocks/storage.ts`
- [ ] `support/mocks/email.ts`
- [ ] `support/helpers/db.ts`
- [ ] `support/helpers/usage.ts`
- [ ] `support/helpers/auth.ts`
- [ ] `support/helpers/token.ts`
- [ ] `apps/web/src/app/api/test/email-sink/route.ts` (only when `NEXTAUTH_TEST_MODE=true`)
- [ ] `.github/workflows/e2e.yml`
- [ ] Per-tier seeker accounts seeded in DB
- [ ] Verify `gap_analysis` / `email_find` / `resume_history` / `followup_reminders` quota status with team

### Auth (Week 2) — 12 specs
- [ ] `auth/seeker-login.spec.ts`
- [ ] `auth/employer-login.spec.ts`
- [ ] `auth/admin-login.spec.ts`
- [ ] `auth/invalid-credentials.spec.ts`
- [ ] `auth/seeker-signup.spec.ts`
- [ ] `auth/employer-signup.spec.ts`
- [ ] `auth/signup-validation.spec.ts`
- [ ] `auth/password-reset-request.spec.ts`
- [ ] `auth/password-reset-confirm.spec.ts`
- [ ] `auth/google-oauth-redirect.spec.ts`
- [ ] `auth/session-cookies.spec.ts`
- [ ] `auth/session-expiry.spec.ts`

### Public (Week 2) — 3 specs
- [ ] `public/landing.spec.ts`
- [ ] `public/pricing.spec.ts`
- [ ] `public/seo-meta.spec.ts`

### Anonymous Token Flows (Week 2) — 4 specs
- [ ] `anon/assessment-take.spec.ts`
- [ ] `anon/assessment-anti-cheat.spec.ts`
- [ ] `anon/public-interview.spec.ts`
- [ ] `anon/public-job-apply.spec.ts`

### Seeker — Onboarding/Dashboard/Jobs/Resume/Profile (Week 3) — 19 specs
- [x] `seeker/onboarding/onboarding.spec.ts` ← **DONE ✅**
- [ ] `seeker/onboarding/onboarding-redirect.spec.ts`
- [ ] `seeker/onboarding/resume-parse-error.spec.ts`
- [ ] `seeker/dashboard/dashboard-load.spec.ts`
- [ ] `seeker/dashboard/dashboard-stats.spec.ts`
- [ ] `seeker/dashboard/dashboard-empty.spec.ts`
- [ ] `seeker/jobs/browse.spec.ts`
- [ ] `seeker/jobs/search-filter.spec.ts`
- [ ] `seeker/jobs/job-detail.spec.ts`
- [ ] `seeker/jobs/save-job.spec.ts`
- [ ] `seeker/jobs/apply-modal.spec.ts`
- [ ] `seeker/jobs/applications-list.spec.ts`
- [ ] `seeker/jobs/search-result-cap.spec.ts` — UI live test for `jobs_per_search` (5/25/-1/-1)
- [ ] `seeker/resume/upload-and-parse.spec.ts`
- [ ] `seeker/resume/parse-result-edit.spec.ts`
- [ ] `seeker/resume/tailor-resume.spec.ts`
- [ ] `seeker/profile/basic-info.spec.ts`
- [ ] `seeker/profile/skills.spec.ts`
- [ ] `seeker/profile/experience.spec.ts`
- [ ] `seeker/profile/education.spec.ts`

### Seeker — Outreach/Tracker/Community/Companies/Schedule/Tests/Interviews/Analytics/Notifications/Alerts/Settings (Week 4) — 25 specs
- [ ] `seeker/outreach/cold-email-generate.spec.ts`
- [ ] `seeker/outreach/linkedin-msg-generate.spec.ts`
- [ ] `seeker/outreach/referral-msg-generate.spec.ts`
- [ ] `seeker/outreach/history-management.spec.ts`
- [ ] `seeker/tracker/applied-tab.spec.ts`
- [ ] `seeker/tracker/personal-kanban.spec.ts`
- [ ] `seeker/tracker/manual-add.spec.ts`
- [ ] `seeker/tracker/filters.spec.ts`
- [ ] `seeker/tests/list-pending.spec.ts`
- [ ] `seeker/tests/list-completed.spec.ts`
- [ ] `seeker/tests/empty-states.spec.ts`
- [ ] `seeker/interviews/report-load.spec.ts`
- [ ] `seeker/interviews/transcript.spec.ts`
- [ ] `seeker/interviews/error-states.spec.ts`
- [ ] `seeker/schedule/calendar-connected.spec.ts`
- [ ] `seeker/schedule/calendar-not-connected.spec.ts`
- [ ] `seeker/schedule/empty-state.spec.ts`
- [ ] `seeker/community/hub.spec.ts`
- [ ] `seeker/community/discussions.spec.ts`
- [ ] `seeker/community/interviews.spec.ts`
- [ ] `seeker/community/salaries.spec.ts`
- [ ] `seeker/companies/browse.spec.ts`
- [ ] `seeker/companies/detail.spec.ts`
- [ ] `seeker/analytics/seeker-analytics.spec.ts`
- [ ] `seeker/notifications/inbox.spec.ts`

### Seeker — Plan-Gating + Verification + Settings + Alerts + Notifications-realtime (Week 5) — 13 specs
- [ ] `seeker/alerts/create-alert.spec.ts`
- [ ] `seeker/alerts/manage-alerts.spec.ts`
- [ ] `seeker/notifications/realtime.spec.ts`
- [ ] `seeker/plan-gating/job-search-quota.spec.ts`
- [ ] `seeker/plan-gating/resume-tailor-quota.spec.ts`
- [ ] `seeker/plan-gating/cold-email-quota.spec.ts`
- [ ] `seeker/plan-gating/linkedin-msg-quota.spec.ts`
- [ ] `seeker/plan-gating/referral-msg-quota.spec.ts`
- [ ] `seeker/plan-gating/active-applications-quota.spec.ts`
- [ ] `seeker/plan-gating/gap-analysis-quota.spec.ts` — `test.fixme()`, tech debt
- [ ] `seeker/plan-gating/email-find-quota.spec.ts` — `test.fixme()`, tech debt
- [ ] `seeker/plan-gating/resume-history-quota.spec.ts` — `test.fixme()`, tech debt
- [ ] `seeker/plan-gating/followup-reminders-quota.spec.ts` — `test.fixme()`, tech debt
- [ ] `seeker/plan-gating/jobs-per-search-quota.spec.ts` — `test.fixme()`, backend bypass
- [ ] `seeker/plan-gating/job-alerts-flag.spec.ts`
- [ ] `seeker/plan-gating/chrome-extension-flag.spec.ts`
- [ ] `seeker/plan-gating/resume-templates-flag.spec.ts`
- [ ] `seeker/plan-gating/upgrade-modal.spec.ts`
- [ ] `seeker/settings/account-settings.spec.ts`
- [ ] `seeker/settings/notifications.spec.ts`
- [ ] `seeker/settings/verification.spec.ts`
- [ ] `seeker/settings/plan.spec.ts`

### Employer — Onboarding/Dashboard/Jobs/Pipeline/Candidates (Week 6) — 20 specs
- [ ] `employer/onboarding/company-setup.spec.ts`
- [ ] `employer/onboarding/onboarding-redirect.spec.ts`
- [ ] `employer/dashboard/dashboard-load.spec.ts`
- [ ] `employer/dashboard/dashboard-stats.spec.ts`
- [ ] `employer/jobs/list.spec.ts`
- [ ] `employer/jobs/create.spec.ts`
- [ ] `employer/jobs/edit.spec.ts`
- [ ] `employer/jobs/publish-unpublish.spec.ts`
- [ ] `employer/jobs/delete.spec.ts`
- [ ] `employer/jobs/duplicate.spec.ts`
- [ ] `employer/pipeline/kanban-view.spec.ts`
- [ ] `employer/pipeline/list-view.spec.ts`
- [ ] `employer/pipeline/candidate-drawer.spec.ts`
- [ ] `employer/pipeline/stage-move.spec.ts`
- [ ] `employer/pipeline/reject.spec.ts`
- [ ] `employer/pipeline/ai-screen-single.spec.ts`
- [ ] `employer/pipeline/ai-screen-bulk.spec.ts`
- [ ] `employer/pipeline/vote.spec.ts`
- [ ] `employer/candidates/list.spec.ts`
- [ ] `employer/candidates/detail.spec.ts`

### Employer — Talent-Pool/Assessments/Interviews/Panels/Scheduling/Branding/Promotions/Analytics/Company/QuestionBank (Week 7) — 26 specs
- [ ] `employer/talent-pool/list-and-filters.spec.ts`
- [ ] `employer/talent-pool/find-matches.spec.ts`
- [ ] `employer/talent-pool/tags.spec.ts`
- [ ] `employer/talent-pool/reengage.spec.ts`
- [ ] `employer/assessments/list.spec.ts`
- [ ] `employer/assessments/create.spec.ts`
- [ ] `employer/assessments/edit.spec.ts`
- [ ] `employer/assessments/assign.spec.ts`
- [ ] `employer/assessments/results.spec.ts`
- [ ] `employer/interviews/list.spec.ts`
- [ ] `employer/interviews/invite-and-resend.spec.ts`
- [ ] `employer/interviews/detail-and-flagged.spec.ts`
- [ ] `employer/panels/manage-panels.spec.ts`
- [ ] `employer/panels/compare-candidates.spec.ts`
- [ ] `employer/scheduling/week-view.spec.ts`
- [ ] `employer/scheduling/create-and-reschedule.spec.ts`
- [ ] `employer/scheduling/feedback.spec.ts`
- [ ] `employer/branding/edit-tab.spec.ts`
- [ ] `employer/branding/preview-tab.spec.ts`
- [ ] `employer/branding/day-in-the-life.spec.ts`
- [ ] `employer/promotions/list.spec.ts`
- [ ] `employer/analytics/overview.spec.ts`
- [ ] `employer/analytics/funnel.spec.ts`
- [ ] `employer/analytics/sources.spec.ts`
- [ ] `employer/analytics/jobs-table.spec.ts`
- [ ] `employer/analytics/interviewers-table.spec.ts`

### Employer — Company/Team/Settings/QuestionBank (Week 8 part 1) — 9 specs
- [ ] `employer/company/profile.spec.ts`
- [ ] `employer/company/logo-upload.spec.ts`
- [ ] `employer/team/list.spec.ts`
- [ ] `employer/team/rbac-invite-member.spec.ts`
- [ ] `employer/team/rbac-change-role.spec.ts`
- [ ] `employer/team/rbac-branding.spec.ts`
- [ ] `employer/team/rbac-gaps.spec.ts`
- [ ] `employer/settings/general.spec.ts`
- [ ] `employer/settings/billing.spec.ts`
- [ ] `employer/question-bank/manage.spec.ts`

### Admin (Week 8 part 2) — 16 specs
- [ ] `admin/dashboard/load.spec.ts`
- [ ] `admin/users/list.spec.ts`
- [ ] `admin/users/detail.spec.ts`
- [ ] `admin/users/suspend.spec.ts`
- [ ] `admin/users/change-role.spec.ts`
- [ ] `admin/companies/list.spec.ts`
- [ ] `admin/companies/detail.spec.ts`
- [ ] `admin/companies/verify.spec.ts`
- [ ] `admin/jobs/moderation.spec.ts`
- [ ] `admin/jobs/flag.spec.ts`
- [ ] `admin/plans/list.spec.ts`
- [ ] `admin/plans/assign.spec.ts`
- [ ] `admin/assessments/global.spec.ts`
- [ ] `admin/audit/audit-log.spec.ts`
- [ ] `admin/security/non-admin-blocked.spec.ts`
- [ ] `admin/api/stats.spec.ts`

### API / Edge (Week 8 part 3) — 11 specs
- [ ] `api/rate-limiting/signup-rate-limit.spec.ts`
- [ ] `api/rate-limiting/ai-rate-limit.spec.ts`
- [ ] `api/rate-limiting/code-execute-rate-limit.spec.ts`
- [ ] `api/rate-limiting/assessment-submit-rate-limit.spec.ts`
- [ ] `api/rate-limiting/employer-rate-limit.spec.ts`
- [ ] `api/usage/usage-endpoint.spec.ts`
- [ ] `api/middleware/unauthenticated-redirect.spec.ts`
- [ ] `api/middleware/role-guard.spec.ts`
- [ ] `api/middleware/csrf.spec.ts`
- [ ] `api/health/health-endpoint.spec.ts`
- [ ] `api/integrations/calendar-callback.spec.ts`

---

## Resolved Decisions (locked 2026-04-30)

The 5 open questions are resolved. These decisions are binding for all spec implementations.

### 1. Quota reset cadence: **24-hour rolling reset**

All 6 quota counters reset every 24 hours (DAU-optimized monetization model — not monthly calendar).

**Test approach:** Use `support/helpers/usage.ts::backdateUsageTimestamp(userId, feature, hoursAgo)` to manipulate `created_at`/`updated_at` on `usage_logs` rows. Verifies that:
- Counter at quota with `created_at = now - 23h` → still blocked
- Counter at quota with `created_at = now - 25h` → resets, action allowed

Add a 5th test to each quota spec: **"counter resets after 24 hours"**. So each of the 6 quota specs becomes 5 tests, not 4. Updated test count: ~480 (was ~470).

### 2. Unimplemented limits (`gap_analysis`, `email_find`, `resume_history`, `followup_reminders`): **document as tech debt with `test.fixme()`**

Write the tests as if `plan-limits.ts` were enforced (under/at-1/at/after-upgrade boundaries). Mark each with `test.fixme()` so they're collected, listed in the report, and don't run as failures. They serve as living documentation of the gap.

**Add 4 new fixme spec files in `seeker/plan-gating/`** (W5):
- [ ] `seeker/plan-gating/gap-analysis-quota.spec.ts` — fixme, expects `hasQuota('gap_analysis')` in `/api/jobs/gap-analysis`
- [ ] `seeker/plan-gating/email-find-quota.spec.ts` — fixme
- [ ] `seeker/plan-gating/resume-history-quota.spec.ts` — fixme
- [ ] `seeker/plan-gating/followup-reminders-quota.spec.ts` — fixme

When backend enforcement lands, drop the `.fixme` and the tests light up green automatically.

**Updated spec totals:** 162 → **166 specs**, ~480 → **~496 tests**.

### 3. `jobs_per_search` enforcement: **frontend-only today, fixme backend bypass**

Currently: UI caps the visible jobs in `/api/jobs/search` results client-side. Backend does not truncate.

**Add 1 spec in W4** (covers the UI constraint as live test):
- [ ] `seeker/jobs/search-result-cap.spec.ts` (3): Free user searches → at most 5 jobs in DOM; Starter → 25; Pro/Elite → no cap. (Live tests.)

**Add 1 fixme spec in W5** (documents the backend gap):
- [ ] `seeker/plan-gating/jobs-per-search-quota.spec.ts` — fixme, asserts backend should also truncate or 402 when over the per-search cap.

**Updated spec totals:** 166 → **168 specs**, ~496 → **~503 tests**.

### 4. Last-admin demotion safeguard: **test current reality with TODO marker**

Today: `PUT /api/employer/company/members/[id]` allows demoting the last admin (no safeguard). Write test that **passes against current behavior** with a `// TODO: BUG — should reject when this is the last admin` comment above the test body, plus a `test.info().annotations.push({ type: 'bug', description: '...' })` so it surfaces in the Playwright report's annotations panel.

Concrete: in `employer/team/rbac-change-role.spec.ts`, the "can't change own role" assertion stays. The "last admin can't be demoted" assertion is replaced with **"BUG: last admin CAN currently be demoted"** — same shape, opposite expectation, marked.

### 5. Zero employer plan limits: **confirmed, no employer plan-gating specs**

Monetization is seeker-side only. Employer plan-gating section stays removed.

---

## Final Totals (Locked)

- **Spec files:** 168
- **Individual tests:** ~503
- **Distribution:**
  - Auth: 12 specs
  - Public: 3 specs
  - Anonymous Token Flows: 4 specs
  - Seeker: 60 specs (54 + 1 search-result-cap + 5 plan-gating fixme additions)
  - Employer: 62 specs
  - Admin: 16 specs
  - API/Edge: 11 specs

---

*Last updated: 2026-04-30. v2.0 (locked with team decisions). Maintained alongside spec files. Update the checklist as each spec is written and passes CI.*
