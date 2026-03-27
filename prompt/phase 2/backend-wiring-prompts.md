# Backend Wiring Prompts — Replace Mock Data with Real APIs

> Use these prompts AFTER the database migration is complete and Phase 1A backend is tested and working. Each prompt wires up one section of the frontend to real Supabase data and API calls.

> For every prompt: attach `project-structure.md`, `api-contracts.md`, and `database-schema.md`.

---

## Prompt B2-1: Employer Auth + Company CRUD

Wire up the employer onboarding and company management.

**API routes to create:**
```
POST /api/employer/company           → Create company + set user as admin
PUT  /api/employer/company           → Update company profile
GET  /api/employer/company           → Get current user's company
POST /api/employer/company/members   → Invite team member
GET  /api/employer/company/members   → List team members
PUT  /api/employer/company/members/:id → Change role / deactivate
```

**Logic:**
- When user creates a company, add 'employer' to their `user_type` array, create company record, create company_member record with role 'admin'
- Invite flow: create company_member with status 'invited' + invite_email, send email (or just log for now)
- Auth middleware: create `getEmployerSession()` helper that checks user has 'employer' in user_type AND is an active member of a company

**Frontend wiring:**
- Replace all mock company data in employer onboarding with real Supabase calls
- Replace mock team members in settings/team page with real data
- Add loading states and error handling to all forms

---

## Prompt B2-2: Job Posts CRUD

Wire up job posting creation, editing, listing.

**API routes:**
```
POST /api/employer/jobs              → Create job post
GET  /api/employer/jobs              → List company's job posts (with filters)
GET  /api/employer/jobs/:id          → Get single job post
PUT  /api/employer/jobs/:id          → Update job post
PUT  /api/employer/jobs/:id/status   → Change status (publish, pause, close)
POST /api/employer/jobs/:id/duplicate → Duplicate a job post
```

**Logic:**
- On publish: also create a record in the `jobs` table (the scraped jobs table) with `is_fitvector_posted = true` and `job_post_id` linked. This makes it appear in job seekers' search results.
- Job posts only visible to company members (RLS enforced)
- Increment `applications_count` on the job post when new applicants arrive

**Frontend wiring:**
- Replace mock jobs list in employer dashboard with real data
- Job posting wizard saves to database on each step (draft auto-save)
- Job status changes update in real-time

---

## Prompt B2-3: Applicant Pipeline + AI Screening

Wire up applicant management and the screening engine.

**API routes:**
```
GET  /api/employer/jobs/:id/applicants     → List applicants for a job (with filters, sorting)
GET  /api/employer/applicants/:id          → Get single applicant detail
PUT  /api/employer/applicants/:id/stage    → Move applicant to new pipeline stage
PUT  /api/employer/applicants/:id/reject   → Reject with reason
POST /api/employer/applicants/:id/screen   → Trigger AI screening for one applicant
POST /api/employer/jobs/:id/screen-all     → Bulk screen all unscreened applicants
```

**AI Screening logic (Python microservice):**
- New endpoint: `POST /ai/screen-resume`
- Takes: applicant's parsed_resume_json + job_post's description + required_skills + dimension_weights
- Returns: screening_score (0-100), screening_breakdown (per dimension), screening_summary (3-4 sentences), bucket
- Uses the 6-dimension scoring from the PRD: skill match (30%), experience relevance (25%), education fit (10%), achievement signals (15%), cultural keywords (10%), screening questions (10%)
- Weights are configurable per job post via dimension_weights JSONB

**Frontend wiring:**
- Replace mock applicant cards in pipeline with real Supabase data
- Kanban drag-drop updates pipeline_stage via API
- Candidate detail slide-over fetches real applicant data
- Screening results show real AI-generated scores and summaries
- Bulk actions work on selected applicants

---

## Prompt B2-4: AI Interview Backend

Wire up the AI interview invitation and (placeholder) execution flow.

**API routes:**
```
POST /api/employer/applicants/:id/invite-interview  → Send AI interview invite
GET  /api/employer/interviews                        → List all AI interviews for company
GET  /api/employer/interviews/:id                    → Get interview detail + report
GET  /api/employer/interviews/compare                → Compare multiple candidates
```

**Candidate-facing routes:**
```
GET  /api/interview/:token              → Get interview info (for candidate landing page)
POST /api/interview/:token/start        → Start interview session
POST /api/interview/:token/complete     → Submit completed interview
```

**Logic:**
- Invite creates ai_interviews record with status 'invited', generates unique token, sends email to candidate with interview link
- For MVP: the actual voice AI interview is NOT built yet. Instead, create a placeholder interview experience page that shows "AI Interview Coming Soon — for now, please answer these questions in text form" with the interview questions displayed as a text form
- When candidate submits text answers, call Python service to generate evaluation report from the text answers (simulates what the voice AI would produce)
- Store transcript, evaluation, scores in ai_interviews table

**Frontend wiring:**
- Employer interview list page shows real data
- Interview report page displays real evaluation data
- Candidate comparison page pulls real scores
- Invite button on applicant card triggers real API call

---

## Prompt B2-5: Assessment Backend

Wire up the assessment system.

**API routes:**
```
POST /api/employer/assessments              → Create assessment
GET  /api/employer/assessments              → List company's assessments
GET  /api/employer/assessments/:id          → Get assessment detail
PUT  /api/employer/assessments/:id          → Update assessment
POST /api/employer/assessments/:id/assign   → Assign assessment to applicant(s)
GET  /api/employer/assessments/:id/results  → List submissions for an assessment
GET  /api/employer/submissions/:id          → Get single submission detail
PUT  /api/employer/submissions/:id/grade    → Manual grading
```

**Candidate-facing routes:**
```
GET  /api/assessment/:token               → Get assessment info + questions
POST /api/assessment/:token/start         → Start timer
POST /api/assessment/:token/submit        → Submit answers
```

**Logic:**
- Assign creates assessment_submissions record with status 'invited', generates unique token, sends email
- MCQ auto-grading: compare selected_answers with correct_answers, compute score
- Coding auto-grading (simplified for MVP): just store the code, don't actually run it. Manual grading by employer.
- Time tracking: record started_at on start, check time_limit on submit, reject if over limit
- Case study and assignment: always manual grading

**Frontend wiring:**
- Assessment builder saves to database
- Candidate assessment page fetches real questions
- Timer counts down from real time_limit
- Results page shows real submissions and scores
- Grading interface updates real scores

---

## Prompt B2-6: Scheduling + Notes + Voting

Wire up human interview scheduling, candidate notes, and team voting.

**API routes:**
```
POST /api/employer/applicants/:id/schedule    → Schedule human interview
GET  /api/employer/scheduling                  → List all scheduled interviews
PUT  /api/employer/scheduling/:id             → Reschedule / cancel
POST /api/employer/scheduling/:id/feedback    → Submit interviewer feedback

POST /api/employer/applicants/:id/notes       → Add note
GET  /api/employer/applicants/:id/notes       → List notes

POST /api/employer/applicants/:id/vote        → Cast vote
GET  /api/employer/applicants/:id/votes       → Get all votes
```

**Logic:**
- Scheduling: for MVP, no calendar integration. Just store the scheduled_at time and generate a Google Meet link placeholder. Real calendar sync comes later.
- Notes: store with author_id, support @mentions (just store the user IDs, frontend handles display)
- Voting: one vote per team member per applicant. Can update (change vote). Show consensus summary.

**Frontend wiring:**
- Scheduling page shows real interviews from database
- Candidate detail panel notes tab is live (add/view real notes)
- Voting pills show real team votes
- Decision summary computes from real vote data

---

## Prompt B2-7: Employer Analytics + Talent Pool

Wire up analytics dashboard and talent pool.

**API routes:**
```
GET /api/employer/analytics                    → Full analytics data
GET /api/employer/analytics/funnel             → Hiring funnel data
GET /api/employer/analytics/sources            → Source analysis
GET /api/employer/talent-pool                  → List talent pool candidates
POST /api/employer/talent-pool/:id/tags        → Add/remove tags
POST /api/employer/talent-pool/:id/reengage    → Send re-engagement email
```

**Logic:**
- Analytics queries aggregate data from applicants, ai_interviews, assessment_submissions, human_interviews tables
- Funnel: COUNT applicants grouped by pipeline_stage per job
- Sources: COUNT applicants grouped by source, with average screening_score per source
- Time-to-hire: AVG days between applicant.created_at and stage='hired' transition
- Talent pool: applicants where is_talent_pool = true, filterable by tags and skills

**Frontend wiring:**
- Dashboard stats pull real aggregated data
- Charts render real data via recharts
- Talent pool table is searchable and filterable from real data
- Re-engage button logs the action (actual email sending can be added later)

---

## Prompt B3-1: Marketplace Backend (One-Click Apply)

Wire up the connection between job seekers and employers.

**API routes:**
```
POST /api/apply/fitvector/:jobPostId          → One-click apply (seeker side)
GET  /api/applications/fitvector              → List my FitVector applications (seeker side)
GET  /api/applications/fitvector/:id/status   → Get real-time status (seeker side)
```

**Logic:**
- When seeker applies via FitVector: create fitvector_applications record + create applicants record in employer's pipeline
- Link the seeker's tailored_resume_id and match_score
- If job has auto_advance_threshold and score >= threshold, auto-set stage to 'ai_interviewed' and trigger AI interview invite
- Status updates: when employer moves applicant in pipeline, the corresponding fitvector_application status updates too (use a database trigger or sync in the API)

**Frontend wiring:**
- "Apply via FitVector" button on job detail calls real API
- Seeker's tracker shows real-time status for FitVector applications
- Status timeline shows real timestamps

---

## Prompt B3-2: Community + Salary Backend

Wire up community features.

**API routes:**
```
POST /api/community/posts                  → Create post (interview experience, discussion)
GET  /api/community/posts                  → List posts (with filters, pagination)
GET  /api/community/posts/:id              → Get post detail with comments
POST /api/community/posts/:id/comments     → Add comment
POST /api/community/vote                   → Upvote/downvote (post or comment)

POST /api/salary/report                    → Submit salary report
GET  /api/salary/insights                  → Get aggregated salary data (role + location)
```

**Logic:**
- Posts: create with user_id, support anonymous flag (if anonymous, never expose user_id in GET responses)
- Voting: one vote per user per target. Toggle behavior (vote again = remove vote). Update upvotes/downvotes count on the post/comment.
- Salary: INSERT individual reports, but GET endpoint returns only aggregated data (median, P25, P75, count). If count < 10 for a role+location, return "insufficient data".
- Community moderation: for MVP, just use the status field. No AI moderation yet.

**Frontend wiring:**
- Interview experiences feed pulls real posts
- Discussion threads show real data with threaded comments
- Upvote/downvote updates in real-time (optimistic updates)
- Salary insights page queries real aggregated data
- "Contribute" forms submit to real API

---

# Execution Order

1. Run the **database migration prompt** first (creates all tables)
2. Fix and test **Phase 1A backend** (Gemini API errors)
3. Then run backend prompts in order: B2-1 → B2-2 → B2-3 → B2-4 → B2-5 → B2-6 → B2-7 → B3-1 → B3-2
4. Each prompt replaces mock data with real API calls in the already-built frontend
5. Test each section after wiring before moving to the next
