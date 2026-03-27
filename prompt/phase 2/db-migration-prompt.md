# Database Migration — Add Phase 2 + 3 + Assessment Tables

> Paste this in your coding chat. Attach `database-schema.md`, `prd-phase2.md`, and `prd-phase3.md`.

---

The Phase 1 database schema is already live in Supabase. I need to ADD new tables and modify existing ones for Phase 2 (employer), Phase 3 (marketplace), and the Assessment feature — without breaking anything that already exists.

Generate TWO outputs:
1. A new migration SQL file (`supabase/migrations/YYYYMMDD_phase2_phase3_tables.sql`) that I can run in Supabase SQL Editor
2. Updated TypeScript types in `packages/shared/src/types/` to match all new tables (also note: the frontend has its own type files at `apps/web/src/types/employer.ts`, `marketplace.ts`, `community.ts` — these are the UI-layer types and do NOT need to be regenerated; the shared types are the API contract layer)

**Important rules:**
- Do NOT recreate Phase 1 tables (users, user_profiles, jobs, job_matches, tailored_resumes, generated_outreach, applications, usage_logs, recruiter_emails, notification_log) — they already exist
- Only ALTER existing tables where needed, and CREATE new tables
- All new tables need Row Level Security enabled
- All new tables need `created_at` and `updated_at` timestamps with auto-update triggers
- Use the same `update_updated_at()` trigger function that already exists
- Every table needs appropriate indexes for the queries we'll run
- Use `IF NOT EXISTS` on all CREATE TABLE and `IF NOT EXISTS` on all ALTER TABLE ADD COLUMN for idempotency
- **FK ordering matters**: create referenced tables BEFORE the tables that reference them. If an ALTER adds a FK to an existing table, place that ALTER AFTER the referenced table's CREATE

---

## Part A — Modifications to existing Phase 1 tables

**1. users table — NO changes needed:**
```sql
-- Do NOT add company_id to users table. Company membership is handled
-- entirely through the company_members junction table (table #4).
-- This allows a user to belong to multiple companies (e.g., freelance recruiter).
-- Do NOT add employer_role to users table — role is per-company via company_members.
```
Note: `user_type` array column already exists and supports 'seeker' and 'employer'. When a user creates or joins a company, add 'employer' to their user_type array. The company_members table handles which company and what role.

**2. jobs table — add link to employer-posted jobs (MUST run AFTER job_posts table is created in Part B):**
```sql
-- Place this ALTER AFTER the CREATE TABLE job_posts statement
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL;
-- NOTE: Do NOT add is_fitvector_posted — it's redundant. The existing 'sources' array
-- column already includes 'fitvector' as a value, and the frontend checks
-- job.sources.includes("fitvector") to identify FitVector-posted jobs.
```

**3. notification_log table — add marketplace reference:**
```sql
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS fitvector_application_id UUID;
-- FK added after fitvector_applications table is created in Part C
```

---

## Part B — New Phase 2 tables (Employer/Hiring)

**4. companies**
```
- id UUID PK DEFAULT gen_random_uuid()
- name TEXT NOT NULL
- logo_url TEXT
- website_url TEXT
- industry TEXT
- company_size TEXT (enum: '1-10', '11-50', '51-200', '201-1000', '1000+')
- description TEXT
- culture_keywords TEXT[]
- locations JSONB (array of {city, state, country})
- branding JSONB (banner_url, story, team_photos[], benefits[], culture_values[], day_in_the_life[] — for Phase 3 employer branding)
- created_by UUID FK → users
- plan_tier TEXT DEFAULT 'starter' (starter, growth, business, enterprise)
- plan_expiry TIMESTAMPTZ
- plan_payment_id TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
RLS: members of the company can read/write.

**5. company_members**
```
- id UUID PK DEFAULT gen_random_uuid()
- company_id UUID FK → companies NOT NULL
- user_id UUID FK → users NOT NULL
- role TEXT NOT NULL (admin, recruiter, hiring_manager, viewer)
- invited_by UUID FK → users
- invite_email TEXT (for pending invites where user hasn't signed up yet)
- status TEXT NOT NULL DEFAULT 'invited' (invited, active, deactivated)
- invited_at TIMESTAMPTZ DEFAULT NOW()
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(company_id, user_id)
```
RLS: company members can see their own company's members.

**6. job_posts (employer-created jobs — distinct from scraped 'jobs' table)**
```
- id UUID PK DEFAULT gen_random_uuid()
- company_id UUID FK → companies NOT NULL
- created_by UUID FK → users NOT NULL
- title TEXT NOT NULL
- department TEXT
- location TEXT
- is_remote BOOLEAN DEFAULT false
- work_mode TEXT (onsite, remote, hybrid)
- job_type TEXT (fulltime, parttime, contract, internship)
- experience_min INTEGER
- experience_max INTEGER
- salary_min INTEGER
- salary_max INTEGER
- salary_currency TEXT DEFAULT 'INR'
- salary_visible BOOLEAN DEFAULT true
- description TEXT NOT NULL (rich text / markdown)
- required_skills TEXT[]
- nice_to_have_skills TEXT[]
- screening_questions JSONB (array of {id, question, type: "short_answer"|"yes_no"|"multiple_choice", options[], required})
- openings_count INTEGER DEFAULT 1
- application_deadline TIMESTAMPTZ
- interview_plan JSONB (AI interview config: {enabled, interview_type, duration, focus_areas, difficulty_level, custom_questions[]})
- assessment_config JSONB (assessment config: {enabled, assessment_type, time_limit, difficulty_level, custom_questions[]})
- status TEXT NOT NULL DEFAULT 'draft' (draft, active, paused, closed, filled)
- auto_advance_threshold INTEGER (0-100, auto-send AI interview invite)
- auto_reject_threshold INTEGER (0-100, auto-reject below this)
- dimension_weights JSONB (custom screening weights: {skill_match, experience, education, achievements, culture, screening_questions})
- views_count INTEGER DEFAULT 0
- applications_count INTEGER DEFAULT 0
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: company_id, status, created_at DESC.
RLS: company members can CRUD their company's job posts.

**NOW run the deferred ALTER from Part A:**
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_job_post_id ON jobs(job_post_id) WHERE job_post_id IS NOT NULL;
```

**7. applicants**
```
- id UUID PK DEFAULT gen_random_uuid()
- job_post_id UUID FK → job_posts NOT NULL
- user_id UUID FK → users (nullable — NULL for external applicants, set for FitVector users)
- name TEXT NOT NULL
- email TEXT NOT NULL
- phone TEXT
- current_role TEXT
- current_company TEXT
- experience INTEGER (years)
- avatar_url TEXT
- resume_url TEXT
- resume_parsed_json JSONB
- screening_responses JSONB (array of {question_id, answer})
- interest_note TEXT (from one-click apply "why I'm interested")
- source TEXT NOT NULL DEFAULT 'external' (fitvector_organic, external_link, referral, imported, boosted)
- screening_score INTEGER (0-100)
- screening_breakdown JSONB ({skill_match, experience_relevance, education_fit, achievement_signals, culture_fit, screening_questions} — each 0-100)
- screening_summary TEXT (AI-generated)
- bucket TEXT (strong_fit, good_fit, potential_fit, weak_fit)
- pipeline_stage TEXT NOT NULL DEFAULT 'applied' (applied, ai_screened, ai_interviewed, assessment, human_interview, offer, hired, rejected, on_hold)
- rejection_reason TEXT
- is_talent_pool BOOLEAN DEFAULT false
- talent_pool_tags TEXT[]
- is_boosted BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: job_post_id, pipeline_stage, screening_score DESC, user_id, source, bucket.
RLS: company members of the job's company can access.

**8. ai_interviews**
```
- id UUID PK DEFAULT gen_random_uuid()
- applicant_id UUID FK → applicants NOT NULL
- job_post_id UUID FK → job_posts NOT NULL
- interview_type TEXT NOT NULL (technical, behavioral, role_specific, general)
- duration_planned INTEGER (minutes)
- duration_actual INTEGER (minutes)
- status TEXT NOT NULL DEFAULT 'invited' (invited, started, completed, expired, cancelled)
- invite_sent_at TIMESTAMPTZ
- invite_expires_at TIMESTAMPTZ
- started_at TIMESTAMPTZ
- completed_at TIMESTAMPTZ
- transcript JSONB (timestamped array: [{speaker, text, timestamp}])
- audio_recording_url TEXT
- evaluation_report JSONB ({summary, skill_scores[], strengths[], concerns[], communication})
- overall_score INTEGER (0-100)
- skill_scores JSONB (array of {skill, score, justification})
- strengths JSONB (array of strings)
- concerns JSONB (array of strings)
- cheating_confidence TEXT (low, medium, high)
- cheating_signals JSONB (array of {signal, evidence})
- communication_assessment JSONB ({structured_thinking, clarity, curiosity, confidence})
- ai_recommendation TEXT (strong_advance, advance, borderline, reject)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: applicant_id, job_post_id, status, completed_at DESC.

**9. assessments (templates/definitions)**
```
- id UUID PK DEFAULT gen_random_uuid()
- company_id UUID FK → companies NOT NULL
- created_by UUID FK → users NOT NULL
- name TEXT NOT NULL
- assessment_type TEXT NOT NULL (coding_test, mcq_quiz, case_study, assignment)
- time_limit_minutes INTEGER
- difficulty TEXT (easy, medium, hard)
- passing_score INTEGER (0-100)
- questions JSONB (array, structure depends on type:
  - coding_test: [{id, problem, language_options[], test_cases: [{input, expected_output}], points}]
  - mcq_quiz: [{id, question, options[], correct_answers[], explanation, points}]
  - case_study: [{id, scenario, questions[], rubric[]}]
  - assignment: [{id, instructions, deliverables[], format, rubric[]}]
)
- settings JSONB ({auto_grade, plagiarism_detection, camera_proctoring, allow_retakes, randomize_order, max_attempts})
- is_template BOOLEAN DEFAULT false
- times_used INTEGER DEFAULT 0
- status TEXT DEFAULT 'active' (active, archived)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: company_id, assessment_type, is_template.
Note: assessment_type values use underscores to match frontend `AssessmentType` enum: `coding_test`, `mcq_quiz`, `case_study`, `assignment`.

**10. assessment_submissions**
```
- id UUID PK DEFAULT gen_random_uuid()
- assessment_id UUID FK → assessments NOT NULL
- applicant_id UUID FK → applicants NOT NULL
- job_post_id UUID FK → job_posts NOT NULL
- status TEXT NOT NULL DEFAULT 'invited' (invited, started, submitted, graded, expired)
- invited_at TIMESTAMPTZ
- started_at TIMESTAMPTZ
- submitted_at TIMESTAMPTZ
- graded_at TIMESTAMPTZ
- time_taken_minutes INTEGER
- answers JSONB (structure matches question type)
- auto_score INTEGER (for coding and MCQ — auto-graded)
- manual_score INTEGER (for case study and assignment — manually graded)
- final_score INTEGER (auto_score or manual_score or weighted blend)
- grader_id UUID FK → users (who manually graded)
- grader_notes TEXT
- plagiarism_flag BOOLEAN DEFAULT false
- proctoring_flags JSONB (array of detected issues)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: assessment_id, applicant_id, job_post_id, status.

**11. human_interviews (scheduled interviews with team members)**
```
- id UUID PK DEFAULT gen_random_uuid()
- applicant_id UUID FK → applicants NOT NULL
- job_post_id UUID FK → job_posts NOT NULL
- interviewer_id UUID FK → users NOT NULL
- round_number INTEGER NOT NULL
- interview_type TEXT (phone_screen, technical, behavioral, culture_fit, hiring_manager, panel)
- scheduled_at TIMESTAMPTZ
- duration_minutes INTEGER DEFAULT 60
- meeting_link TEXT
- calendar_event_id TEXT (Google/Outlook event ID)
- status TEXT NOT NULL DEFAULT 'scheduled' (scheduled, completed, cancelled, rescheduled, no_show)
- feedback JSONB ({rating, strengths[], concerns[], notes, recommendation})
- rating TEXT (strong_hire, hire, no_hire, strong_no_hire)
- notes TEXT
- rescheduled_from TIMESTAMPTZ
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: applicant_id, job_post_id, interviewer_id, scheduled_at, status.

**12. candidate_notes**
```
- id UUID PK DEFAULT gen_random_uuid()
- applicant_id UUID FK → applicants NOT NULL
- author_id UUID FK → users NOT NULL
- body TEXT NOT NULL
- mentions UUID[] (user IDs mentioned with @)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Index: applicant_id, created_at DESC.

**13. candidate_votes**
```
- id UUID PK DEFAULT gen_random_uuid()
- applicant_id UUID FK → applicants NOT NULL
- voter_id UUID FK → users NOT NULL
- vote TEXT NOT NULL (strong_hire, hire, no_hire, strong_no_hire)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(applicant_id, voter_id)
```
Index: applicant_id.

**14. employer_usage**
```
- id UUID PK DEFAULT gen_random_uuid()
- company_id UUID FK → companies NOT NULL
- action_type TEXT NOT NULL (resume_screen, ai_interview, assessment, job_post)
- month_year TEXT NOT NULL (format: '2026-03')
- count INTEGER DEFAULT 0
- UNIQUE(company_id, action_type, month_year)
```

---

## Part C — New Phase 3 tables (Marketplace + Community)

**15. fitvector_applications (marketplace applications connecting seeker ↔ employer)**
```
- id UUID PK DEFAULT gen_random_uuid()
- applicant_user_id UUID FK → users NOT NULL
- job_post_id UUID FK → job_posts NOT NULL
- applicant_id UUID FK → applicants (created when application flows into employer pipeline)
- tailored_resume_id UUID FK → tailored_resumes
- match_score INTEGER (0-100, pre-computed)
- screening_responses JSONB (array of {question_id, question, type, answer, ai_suggested})
- interest_note TEXT
- resume_name TEXT
- is_boosted BOOLEAN DEFAULT false
- boost_tier TEXT (basic, standard, premium — NULL if not boosted)
- status TEXT NOT NULL DEFAULT 'applied' (applied, under_review, interview_invited, interviewed, decision_pending, offered, rejected, withdrawn)
- status_timeline JSONB DEFAULT '[]' (array of {status, label, timestamp, note})
- status_updated_at TIMESTAMPTZ
- employer_notes TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: applicant_user_id, job_post_id, status, created_at DESC.
Note: The frontend uses `fv_` prefixed statuses (fv_applied, fv_under_review, etc.) for display purposes only. The database stores plain values (applied, under_review, etc.). The frontend maps them by prepending `fv_` when reading from the API.

**NOW add the deferred FK from Part A:**
```sql
ALTER TABLE notification_log ADD CONSTRAINT fk_notification_fv_app
  FOREIGN KEY (fitvector_application_id) REFERENCES fitvector_applications(id) ON DELETE SET NULL;
```

**16. promoted_listings**
```
- id UUID PK DEFAULT gen_random_uuid()
- job_post_id UUID FK → job_posts NOT NULL
- company_id UUID FK → companies NOT NULL
- promotion_type TEXT NOT NULL (sponsored_feed, priority_search)
- duration_days INTEGER NOT NULL (7, 14, or 30)
- start_date DATE NOT NULL
- end_date DATE NOT NULL
- amount_paid INTEGER NOT NULL (in smallest currency unit, e.g., paise for INR)
- currency TEXT DEFAULT 'INR'
- payment_id TEXT (Razorpay/Stripe reference)
- impressions INTEGER DEFAULT 0
- clicks INTEGER DEFAULT 0
- applications INTEGER DEFAULT 0
- status TEXT DEFAULT 'active' (active, expired, paused)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Index: job_post_id, company_id, status, end_date.

**17. application_boosts**
```
- id UUID PK DEFAULT gen_random_uuid()
- fitvector_application_id UUID FK → fitvector_applications NOT NULL
- user_id UUID FK → users NOT NULL
- boost_tier TEXT NOT NULL (basic, standard, premium)
- amount_paid INTEGER NOT NULL
- currency TEXT DEFAULT 'INR'
- payment_id TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()
```

**18. boost_credits (seeker's prepaid boost credits)**
```
- id UUID PK DEFAULT gen_random_uuid()
- user_id UUID FK → users NOT NULL
- credits_remaining INTEGER NOT NULL DEFAULT 0
- credits_purchased INTEGER NOT NULL DEFAULT 0
- amount_paid INTEGER NOT NULL
- currency TEXT DEFAULT 'INR'
- payment_id TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Index: user_id.

**19. community_posts**
```
- id UUID PK DEFAULT gen_random_uuid()
- user_id UUID FK → users NOT NULL
- post_type TEXT NOT NULL (interview_experience, discussion, salary_report)
- title TEXT NOT NULL
- body TEXT NOT NULL
- category TEXT (tech, business, design, marketing, career_advice, salary, general)
- is_anonymous BOOLEAN DEFAULT true
- upvotes INTEGER DEFAULT 0
- downvotes INTEGER DEFAULT 0
- comments_count INTEGER DEFAULT 0
- status TEXT DEFAULT 'published' (published, flagged, removed, under_review)
- interview_data JSONB (only for post_type='interview_experience': {
    company_name, role, difficulty, outcome, rounds: [{round_number, type, questions[]}],
    process_description, tips, overall_rating
  })
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: post_type, category, created_at DESC, status.
Note: Interview-specific fields are stored in `interview_data` JSONB rather than as top-level nullable columns. This keeps the table clean for discussion and salary_report types.

**20. community_comments**
```
- id UUID PK DEFAULT gen_random_uuid()
- post_id UUID FK → community_posts NOT NULL
- user_id UUID FK → users NOT NULL
- parent_comment_id UUID FK → community_comments (for threading, NULL = top-level)
- body TEXT NOT NULL
- is_anonymous BOOLEAN DEFAULT false
- upvotes INTEGER DEFAULT 0
- status TEXT DEFAULT 'published' (published, flagged, removed)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```
Index: post_id, parent_comment_id, created_at.

**21. community_votes (tracks who voted on what — prevents double voting)**
```
- id UUID PK DEFAULT gen_random_uuid()
- user_id UUID FK → users NOT NULL
- target_type TEXT NOT NULL (post, comment)
- target_id UUID NOT NULL
- vote_type TEXT NOT NULL (up, down)
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(user_id, target_type, target_id)
```

**22. user_reputation**
```
- id UUID PK DEFAULT gen_random_uuid()
- user_id UUID FK → users NOT NULL UNIQUE
- karma_points INTEGER DEFAULT 0
- helpful_reviews_count INTEGER DEFAULT 0
- interview_experiences_count INTEGER DEFAULT 0
- community_posts_count INTEGER DEFAULT 0
- badges JSONB DEFAULT '[]'
- updated_at TIMESTAMPTZ DEFAULT NOW()
```

**23. verified_profiles**
```
- id UUID PK DEFAULT gen_random_uuid()
- user_id UUID FK → users NOT NULL UNIQUE
- identity_verified BOOLEAN DEFAULT false
- identity_document_ref TEXT (encrypted reference — NOT raw document)
- education_verified BOOLEAN DEFAULT false
- education_document_ref TEXT
- employment_verified BOOLEAN DEFAULT false
- employment_document_ref TEXT
- skills_verified BOOLEAN DEFAULT false
- skills_assessment_id UUID FK → assessments (which assessment they passed)
- verified_at TIMESTAMPTZ
- expires_at TIMESTAMPTZ (annual re-verification)
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()
```

**24. salary_reports (anonymized)**
```
- id UUID PK DEFAULT gen_random_uuid()
- user_id UUID FK → users NOT NULL (linked but never exposed publicly)
- role_title TEXT NOT NULL
- company_name TEXT (optional — shown as "Anonymous Company" if null)
- company_size TEXT
- location TEXT NOT NULL
- experience_years INTEGER NOT NULL
- base_salary INTEGER NOT NULL (annual, in INR)
- total_compensation INTEGER (annual, in INR — includes bonuses, stock, etc.)
- currency TEXT DEFAULT 'INR'
- is_verified BOOLEAN DEFAULT false (cross-referenced with employment verification)
- created_at TIMESTAMPTZ DEFAULT NOW()
```
Indexes: role_title, location, experience_years.
RLS: user can see own entries. Aggregated queries via database function (never expose individual rows publicly).

---

## Part D — RLS policies for all new tables

For every new table, enable RLS and create these policies:

**Company-owned tables** (companies, job_posts, applicants, ai_interviews, assessments, assessment_submissions, human_interviews, candidate_notes, candidate_votes, employer_usage, promoted_listings):
- SELECT/INSERT/UPDATE/DELETE: only for authenticated users who are members of the relevant company (join through company_members where user_id = auth.uid() and status = 'active')

**User-owned tables** (fitvector_applications, application_boosts, boost_credits, community_posts, community_comments, user_reputation, verified_profiles, salary_reports):
- Users can CRUD their own data (where user_id = auth.uid())

**Special cases:**
- `community_posts` and `community_comments`: all authenticated users can READ where status='published', only author can UPDATE/DELETE
- `salary_reports`: NEVER allow direct SELECT of other users' rows — create a database function `get_salary_aggregation(role_title, location, exp_min, exp_max)` that returns aggregated p25/median/p75/count only (minimum 5 reports required to show data)
- `company_members`: members can see their own company's members, admins can INSERT/UPDATE/DELETE

---

## Part E — Database functions

**1. Salary aggregation function:**
```sql
CREATE OR REPLACE FUNCTION get_salary_aggregation(
  p_role TEXT, p_location TEXT, p_exp_min INT DEFAULT 0, p_exp_max INT DEFAULT 99
) RETURNS TABLE (
  sample_size INT, median_salary INT, p25_salary INT, p75_salary INT, min_salary INT, max_salary INT
) AS $$
  -- Returns aggregated salary data, only if sample_size >= 5
  -- Uses percentile_cont for p25/median/p75
$$;
```

**2. Update applicant counts trigger:**
```sql
-- Auto-increment job_posts.applications_count when an applicant is inserted
CREATE OR REPLACE FUNCTION update_job_post_applicant_count() ...
```

---

## Part F — TypeScript types

Generate updated TypeScript type definitions for ALL new tables in `packages/shared/src/types/`. Create these files:
- `company.ts` — Company, CompanyMember, CompanyBranding types
- `job-post.ts` — JobPost, ScreeningQuestion, InterviewPlan, AssessmentConfig types
- `applicant.ts` — Applicant, PipelineStage, ScreeningBucket, ScreeningBreakdown types
- `ai-interview.ts` — AIInterview, EvaluationReport, SkillScore, CheatingSignal, CommunicationAssessment types
- `assessment.ts` — Assessment, AssessmentSubmission, Question (union type for coding/mcq/case_study/assignment) types
- `human-interview.ts` — HumanInterview, InterviewFeedback types
- `community.ts` — CommunityPost, CommunityComment, InterviewData, UserReputation, SalaryReport types
- `marketplace.ts` — FitVectorApplication, PromotedListing, ApplicationBoost, BoostCredits, BoostTier types
- `verified-profile.ts` — VerifiedProfile type

Update the existing `index.ts` to export all new types.

**Note on frontend types:** The frontend already has UI-layer types at `apps/web/src/types/employer.ts`, `marketplace.ts`, `community.ts`. These contain display-specific things (color maps, label configs, status configs) that don't belong in the shared DB types. Do NOT overwrite them. The shared types are the source-of-truth for DB shape; frontend types extend/adapt them for UI needs.

---

## Part G — Seed Data (realistic mock data for development)

Generate a separate seed file `supabase/seed_phase2_phase3.sql` with realistic mock data. This seed file should be runnable AFTER the migration and will populate the database so the frontend immediately shows real data from Supabase instead of hardcoded JSON.

**CRITICAL: Seed Phase 1 data FIRST. Phase 2/3 data has foreign key dependencies on Phase 1 tables (users, user_profiles, jobs, tailored_resumes, etc.). If you skip Phase 1 seed data, all Phase 2/3 inserts will fail on FK constraints.**

**The seed file MUST follow this exact insertion order:**

### Phase 1 Base Data (seed FIRST — everything else depends on this)

**Users (10 job seekers + 6 employers = 16 total):**
Create 10 job seeker users with realistic Indian profiles:
1. Priya Sharma — Frontend Developer, 4 yrs exp, Bangalore
2. Rahul Verma — Backend Engineer, 2 yrs exp, Mumbai
3. Ananya Patel — Full Stack Developer, 1 yr exp, Pune (fresher)
4. Vikram Singh — DevOps Engineer, 6 yrs exp, Hyderabad
5. Sneha Gupta — Data Scientist, 3 yrs exp, Delhi
6. Arjun Reddy — SRE Engineer, 5 yrs exp, Bangalore
7. Kavita Nair — Product Manager, 4 yrs exp, Mumbai
8. Aditya Kumar — ML Engineer, 2 yrs exp, Bangalore
9. Meera Iyer — QA Engineer, 3 yrs exp, Chennai
10. Rohan Das — Mobile Developer, 1 yr exp, Kolkata

Create 6 employer users:
11. admin@technova.com — TechNova admin
12. recruiter@technova.com — TechNova recruiter
13. admin@finedge.com — FinEdge admin
14. hm@finedge.com — FinEdge hiring manager
15. admin@cloudmatrix.com — CloudMatrix admin
16. recruiter@cloudmatrix.com — CloudMatrix recruiter

All users: auth_provider='credentials', email_verified=true, status='active', onboarding_completed=true. Job seekers get user_type='{seeker}', employers get user_type='{employer}'. Use `gen_random_uuid()` but STORE the UUIDs in SQL variables so they can be referenced later:
```sql
DO $$
DECLARE
  user_priya UUID := gen_random_uuid();
  user_rahul UUID := gen_random_uuid();
  -- ... etc for all 16 users
BEGIN
  -- All inserts go here, referencing these variables
END $$;
```

**User Profiles (10 — one per job seeker):**
Each with:
- Realistic parsed_resume_json containing: name, email, summary (2-3 sentences), experience (1-3 jobs with company, role, dates, 3-4 bullet points each), education (1-2 entries), skills array (8-15 skills), projects (1-2)
- target_roles, target_locations, experience_level, expected_salary_min/max
- skills array (denormalized from parsed_resume_json)
- embedding column: leave NULL for now (will be generated when embedding service runs)

**Scraped Jobs (20 external jobs):**
Mix of jobs from different sources:
- 6 from LinkedIn, 5 from Naukri, 4 from Indeed, 3 from Glassdoor, 2 from Google Jobs
- Roles: Software Engineer, Frontend Developer, Backend Developer, Data Scientist, DevOps, Product Manager, ML Engineer, QA, etc.
- Companies: Infosys, TCS, Wipro, Flipkart, Zomato, Paytm, Ola, Freshworks, Zoho, etc.
- Realistic full descriptions (3-4 paragraphs each), skills_required, salary ranges, locations across Indian cities
- Posted dates spread over last 30 days
- All with is_active=true, source='linkedin' (or appropriate source)

**Job Matches (50 — connecting seekers to scraped jobs):**
- Each seeker matched to 5 jobs with varying scores (35-95 range)
- Appropriate buckets based on scores
- Some marked as is_seen=true, some is_saved=true

**Tailored Resumes (8):**
- Some seekers have tailored resumes for specific jobs
- Each with: latex_source (a minimal valid LaTeX document), pdf_url (placeholder URL), version_name, template_id='modern'

**Generated Outreach (10):**
- Mix of cold_email, linkedin_message, referral_request (use exact enum values)
- Each with realistic subject/body content

**Applications / Tracker (15):**
- Distributed across statuses: 3 saved, 4 applied, 2 screening, 3 interview, 1 offer, 2 rejected
- Some linked to tailored_resumes and generated_outreach
- Realistic notes and follow-up dates
- status_history JSONB showing progression

**Usage Logs (20):**
- Various feature usage entries across seekers

**Notification Log (10):**
- Mix of notification types across users

### Phase 2 Data (seed AFTER Phase 1 — references users, profiles, resumes)

**Companies (3):**
1. "TechNova Solutions" — Series A startup, 51-200 employees, Bangalore, tech/SaaS industry, culture_keywords: ['innovation', 'ownership', 'remote-first'], plan_tier: 'growth'
2. "FinEdge Analytics" — fintech, 11-50 employees, Mumbai, culture_keywords: ['data-driven', 'fast-paced', 'transparency'], plan_tier: 'starter'
3. "CloudMatrix" — cloud infrastructure, 201-1000 employees, Hyderabad, culture_keywords: ['scale', 'reliability', 'collaboration'], plan_tier: 'business'

**Company Members (6):**
- TechNova: 2 members (1 admin, 1 recruiter) — using employer user UUIDs
- FinEdge: 2 members (1 admin, 1 hiring_manager)
- CloudMatrix: 2 members (1 admin, 1 recruiter)
- All with status='active'

**Job Posts (8):**
- TechNova: "Senior Frontend Developer" (active, 3-7 yrs, ₹18-30L), "Backend Engineer" (active, 1-3 yrs, ₹12-20L), "DevOps Engineer" (paused, 5+ yrs)
- FinEdge: "Data Scientist" (active, 2-5 yrs, ₹15-25L), "Full Stack Developer" (active, 1-3 yrs, ₹10-18L)
- CloudMatrix: "SRE Engineer" (active, 3-7 yrs, ₹20-35L), "Platform Engineer" (active, 5+ yrs, ₹25-40L), "Junior Developer" (closed)
- Each job should have: full realistic JD (3-4 paragraphs), required_skills array, nice_to_have_skills array, 2-3 screening questions, interview_plan configured, assessment_config for some jobs

**Applicants (25-30 across all jobs):**
- Distribute across pipeline stages: 8 in applied, 5 in ai_screened, 4 in ai_interviewed, 3 in assessment, 3 in human_interview, 2 in offer, 2 hired, 3 rejected
- Use the 10 job seeker users as applicants (reference their user_ids). Some seekers apply to multiple jobs. Also add 15-20 external applicants (user_id=NULL)
- Each with: current_role, current_company, experience, screening_score (30-95 range), screening_breakdown, screening_summary, appropriate bucket
- Various sources: 10 fitvector_organic (these reference Phase 1 users), 10 external_link, 5 referral

**AI Interviews (8 completed):**
- For applicants in ai_interviewed stage and beyond
- Each with: realistic transcript (10-15 turns), overall_score, skill_scores (3-5 skills each), strengths (3), concerns (3), communication_assessment, ai_recommendation
- 1 interview with cheating_confidence "medium" and 2 cheating signals for variety
- 7 interviews with cheating_confidence "low"

**Assessments (3 templates):**
1. "React Proficiency Test" — mcq_quiz, 15 questions, 45 min, medium difficulty
2. "Backend Coding Challenge" — coding_test, 3 problems, 90 min, medium difficulty
3. "System Design Case Study" — case_study, 2 scenarios, 60 min, hard difficulty
- Each with realistic questions appropriate to the type
- Note: use assessment_type values with underscores (coding_test, mcq_quiz, case_study) to match frontend enums

**Assessment Submissions (6):**
- Mix of submitted and graded statuses
- MCQ submissions with auto-graded scores
- Coding submissions with code snippets
- One flagged for plagiarism

**Human Interviews (5):**
- 3 scheduled (upcoming dates), 2 completed with feedback
- Different types: phone_screen, technical, culture_fit
- Completed ones have: rating, strengths, concerns, notes

**Candidate Notes (10):**
- Distributed across applicants
- Realistic recruiter notes like "Strong coding skills, needs to improve system design", "Great cultural fit, team loved the interaction"
- Some with @mention UUIDs in mentions array

**Candidate Votes (8):**
- Team members voting on shortlisted candidates
- Mix of strong_hire, hire, no_hire

### Phase 3 Data (seed AFTER Phase 2 — references job_posts, applicants, users)

**FitVector Applications (5):**
- 3-5 applications linking Phase 1 seekers to Phase 2 job_posts
- Statuses: 2 applied, 1 under_review, 1 interview_invited, 1 offered
- Each with: match_score, screening_responses, interest_note, resume_name
- status_timeline showing progression (array of {status, label, timestamp, note})
- The under_review one should match the frontend mock (Priya applying to TechNova Sr Frontend Dev)

**Promoted Listings (2):**
- TechNova Sr Frontend Dev — sponsored_feed, 14 days, ₹2,499, 3400 impressions, 89 clicks, 12 apps, active
- TechNova Backend Engineer — priority_search, 7 days, ₹999, 1200 impressions, 34 clicks, 5 apps, active

**Community Posts (30):**
- 15 interview experiences across companies: Google, Amazon, Flipkart, Razorpay, Zerodha, Swiggy, CRED, PhonePe, Atlassian, Microsoft, Infosys, TCS, Wipro, Zomato, Paytm
- Each with interview_data JSONB: {company_name, role, difficulty, outcome, rounds[], process_description, tips, overall_rating}
- 10 discussion threads across categories (tech, career_advice, salary, design, business, general)
- 5 salary_report posts
- Varying upvotes (0-45 range)

**Community Comments (40):**
- Distributed across posts, some threaded (parent_comment_id referencing other comments)
- Realistic responses

**Community Votes (30):**
- Distributed across posts and comments
- Mix of up and down

**Salary Reports (50):**
- Roles: Software Engineer, Frontend Developer, Backend Developer, Data Scientist, Product Manager, DevOps Engineer, Data Analyst, ML Engineer, Full Stack Developer, QA Engineer, UI/UX Designer, Engineering Manager, Tech Lead, Mobile Developer, Cloud Engineer
- Locations: Bangalore, Mumbai, Hyderabad, Delhi, Pune, Chennai, Remote
- Experience: spread across 0-15 years
- Realistic salary ranges for Indian market (e.g., 0-2 yrs SWE in Bangalore: ₹4-12L, 3-5 yrs: ₹12-25L, 6-10 yrs: ₹25-50L)

**User Reputation (5 profiles):**
- For active community contributors
- Varying karma (50 to 500), different badges

**Verified Profiles (3):**
- 1 fully verified (all 4 checks passed), verified_at set, expires_at = +1 year
- 1 partially verified (employment + education only)
- 1 with only identity verified

**Boost Credits (2):**
- 1 seeker with 3 remaining credits (purchased 5, used 2)
- 1 seeker with 0 remaining credits

---

**Important seed data rules:**
- Use `gen_random_uuid()` for all UUIDs but store in variables for FK references
- Use realistic timestamps spread over the last 90 days
- All salary figures in INR (annual)
- Make the data internally consistent:
  - An applicant's screening_score matches their bucket (80+ = strong_fit, 60-79 = good_fit, 40-59 = potential_fit, <40 = weak_fit)
  - A hired candidate went through all pipeline stages in order
  - FitVector application status_timeline entries are chronologically ordered
  - Promoted listing start_date + duration_days = end_date
- Include created_at timestamps that tell a story (applicant applied on day 1, screened on day 2, interviewed on day 5, etc.)
- Community posts use the interview_data JSONB field (not top-level columns) for interview experience data
