# Phase 2 + 3 Frontend Prompts — Complete Employer & Marketplace UI

> Build all pages with mock data. No backend calls needed — use hardcoded JSON arrays and useState for interactions. Wire up real APIs later.

> For EVERY prompt below, attach `project-structure.md` and `prd-phase2.md` (or `prd-phase3.md` for marketplace prompts).

---

## Prompt F2-1: Employer Layout Shell + Company Onboarding

Build the employer-side layout and onboarding flow.

**Employer layout (`apps/web/src/app/(employer)/layout.tsx`):**
- Separate sidebar from the job seeker dashboard
- Sidebar nav items: Dashboard, Jobs, Candidates, Interviews, Assessments, Scheduling, Analytics, Talent Pool, Settings, Team
- Sidebar header shows company logo + name
- Top bar: user avatar, notification bell, "Switch to Job Seeker" link (since a user can be both)
- All employer routes live under `/(employer)/*`
- Use the FitVector design system (brand colors, card styles, etc.)

**Company onboarding wizard (`/(employer)/onboarding/page.tsx`):**
- Step 1: Company basics — name, logo upload, website URL, industry dropdown, company size dropdown
- Step 2: Company profile — description textarea (with "AI Assist" button that would auto-generate from URL), culture keywords (tag input), office locations (multi-input)
- Step 3: Team setup — invite team members by email, assign roles (admin, recruiter, hiring manager, viewer), shows pending invites
- Step 4: First job post — CTA to create first job or skip
- Progress bar at top, back button on each step
- On completion, redirect to employer dashboard

**Mock data:** Pre-fill with a sample company "TechStartup Inc" so the pages look alive.

---

## Prompt F2-2: Employer Dashboard + Job Posting

**Employer dashboard (`/(employer)/dashboard/page.tsx`):**
- Top stats row: Active Jobs (count), Total Applicants, Interviews This Week, Avg Time-to-Hire
- Each stat is a card with large number + small label + trend arrow (up/down %)
- "Recent activity" feed showing: "New applicant for Senior Developer", "AI Interview completed for Priya S.", "Interview scheduled with Rahul M." — each with timestamp and action link
- "Quick actions" section: Post a Job, Review Applicants, Check Interviews
- Chart: Hiring funnel bar chart (Applied → Screened → Interviewed → Offered → Hired) using recharts with brand colors

**Job posting wizard (`/(employer)/jobs/create/page.tsx`):**
- Step 1: Basic info — title, department, location (city input + remote/hybrid/onsite toggle), job type dropdown, experience range (min-max sliders), salary range (optional, with "hide from candidates" toggle), number of openings
- Step 2: Job description — rich text editor (use a simple textarea with markdown preview for now), "AI Assist" button (would generate JD from rough notes — show a placeholder loading animation for now)
- Step 3: Skills — required skills (tag input with autocomplete), nice-to-have skills (tag input)
- Step 4: Screening — add up to 5 custom screening questions, each with type selector (multiple choice, short answer, yes/no)
- Step 5: AI Interview config — toggle on/off, select interview type (technical, behavioral, general), set duration (15/20/30 min dropdown), focus areas (text input), difficulty level (junior/mid/senior radio), up to 3 custom must-ask questions
- Step 6: Assessment config — toggle on/off, select assessment type (coding test, MCQ quiz, case study, assignment), set time limit, select difficulty, add custom questions or choose from template library
- Step 7: Review — shows summary of all steps, "Publish" button

**Jobs list page (`/(employer)/jobs/page.tsx`):**
- Table/card view of all jobs with columns: title, status (draft/active/paused/closed), applicants count, posted date, quick actions (edit, pause, duplicate, close)
- Filter tabs: All, Active, Paused, Closed, Draft
- "Post New Job" button top-right

**Mock data:** 4-5 sample jobs in different statuses with varying applicant counts.

---

## Prompt F2-3: Applicant Pipeline + AI Screening Results

**Applicant pipeline (`/(employer)/jobs/[id]/pipeline/page.tsx`):**
- Kanban board with columns: Applied → AI Screened → AI Interviewed → Assessment → Human Interview → Offer → Hired
- Also a "Rejected" column that's collapsible
- Each candidate card shows: name, photo placeholder, match score badge (0-100 with color), source badge (FitVector / External), applied date
- Click card → opens candidate detail slide-over panel (not a new page)
- Bulk actions bar at top: select multiple → "Advance", "Reject", "Send AI Interview Invite", "Send Assessment"
- Filter bar: score range slider, skills filter, experience filter, source filter
- Toggle between Kanban view and Table view

**Candidate detail slide-over panel:**
- Header: name, email, phone, current role, match score (large)
- Tabs: Resume | Screening | AI Interview | Assessment | Human Interview | Notes
- Resume tab: shows parsed resume sections (experience, education, skills, projects) in clean cards + "View PDF" button
- Screening tab: AI screening summary (3-4 sentences), score breakdown per dimension (skill match, experience, education, achievements, culture fit, screening questions) as horizontal bar charts, bucket label (Strong Fit / Good Fit / etc.)
- Notes tab: team members can add notes, see history of all actions taken on this candidate
- Action buttons at bottom: "Advance to Next Stage", "Reject", "Schedule Interview", "Send Assessment"

**Mock data:** 15-20 mock candidates with varying scores, sources, and stages. Include realistic Indian names and companies.

---

## Prompt F2-4: AI Interview Management

**AI Interview list (`/(employer)/interviews/page.tsx`):**
- Table showing all AI interviews: candidate name, job title, status (invited/started/completed/expired), date, score, cheating flag, action buttons
- Filter tabs: All, Pending, Completed, Flagged
- Stats at top: Total interviews, Completion rate %, Average score, Flagged count

**AI Interview detail/report page (`/(employer)/interviews/[id]/page.tsx`):**
This is the evaluation report page — the primary deliverable employers pay for.

- Header: candidate name, job title, date, overall score (large circular progress), AI recommendation badge (Strong Advance / Advance / Borderline / Reject)
- Section 1 — Executive Summary: 3-4 sentence AI-generated paragraph
- Section 2 — Skill Ratings: radar/spider chart showing scores per competency (use recharts RadarChart), plus a table below with skill name, score (1-5 stars), and one-line justification
- Section 3 — Strengths: 3 bullet points with specific evidence
- Section 4 — Areas of Concern: 3 bullet points with evidence
- Section 5 — Cheating Assessment: confidence level badge (Low/Medium/High) with detected signals listed (if any). Green checkmark if clean.
- Section 6 — Communication: structured thinking score, clarity score, curiosity score, confidence level — each as a small card with score and one-line note
- Section 7 — Full Transcript: expandable accordion, time-stamped, with AI questions in gray and candidate answers in white, searchable
- Section 8 — Audio Playback: audio player bar with play/pause, speed controls (1x, 1.5x, 2x), timeline scrubber
- Section 9 — Compare: button "Compare with other candidates" that would navigate to comparison view
- Action bar at bottom: "Advance to Human Interview", "Advance to Assessment", "Reject", "Download Report as PDF"

**Candidate comparison page (`/(employer)/interviews/compare/page.tsx`):**
- Side-by-side cards (2-3 candidates) showing: name, score, radar chart overlay, skill breakdown, strengths, concerns
- Dropdown to select which candidates to compare
- "Advance Selected" button

**Mock data:** 3 detailed mock interview reports with full transcripts (10-15 turns each), scores, and realistic evaluation content.

---

## Prompt F2-5: Assessment/Test System

**This is the new assessment feature for evaluating shortlisted candidates.**

**Assessment templates page (`/(employer)/assessments/page.tsx`):**
- Library of assessment templates: Coding Test, MCQ Quiz, Case Study, Take-home Assignment
- Each template card shows: name, type, duration, question count, difficulty, times used
- "Create Custom Assessment" button
- Filter by type and difficulty

**Assessment builder (`/(employer)/assessments/create/page.tsx`):**
- Step 1: Basics — assessment name, type (coding/MCQ/case study/assignment), time limit (dropdown: 30min, 1hr, 2hr, 3hr, 24hr, 48hr, 1 week), difficulty, passing score threshold
- Step 2: Questions — depends on type:
  - **Coding test:** code editor area (use a simple textarea with monospace font for now), language selector, test case inputs/expected outputs, multiple problems supported
  - **MCQ quiz:** question text, 4 options (radio for single answer, checkbox for multi), correct answer selection, explanation field, add multiple questions
  - **Case study:** scenario description (rich text), follow-up questions, evaluation rubric
  - **Assignment:** instructions, deliverables checklist, submission format (PDF/link/zip), evaluation criteria
- Step 3: Settings — auto-grading on/off (for MCQ and coding), plagiarism detection toggle, camera proctoring toggle, allow retakes toggle, randomize question order
- Step 4: Preview — shows how the candidate will see the assessment
- "Save as Template" and "Assign to Candidates" buttons

**Assessment results page (`/(employer)/assessments/[id]/results/page.tsx`):**
- Candidate list with: name, score, time taken, submitted date, status (pending/completed/graded/expired)
- Click candidate → detailed result view:
  - For coding: code submitted, test cases passed/failed, time per problem
  - For MCQ: answers selected vs correct, score breakdown by topic
  - For case study/assignment: submitted content, evaluation rubric with scores per criteria
- "Grade" button for manual grading (case study and assignment types)

**Candidate assessment experience page (`/(employer)/assessments/take/[id]/page.tsx`):**
This is what the CANDIDATE sees when they take the assessment.
- Welcome screen: assessment name, company logo, duration, rules, "Start Assessment" button
- Timer bar at top (countdown), progress indicator
- For coding: split view — left is problem description, right is code editor with language selector and "Run Tests" button, test case results panel below
- For MCQ: one question at a time with next/prev navigation, question list sidebar showing answered/unanswered
- For case study: scenario on left, answer area on right
- Submit confirmation modal: "Are you sure? You cannot change answers after submitting."
- Thank you screen after submission

**Mock data:** 2 sample assessments (one coding test with 3 problems, one MCQ with 10 questions), 5 mock candidate results.

---

## Prompt F2-6: Interview Scheduling + Team Collaboration

**Scheduling page (`/(employer)/scheduling/page.tsx`):**
- Calendar view (week view by default) showing all scheduled interviews
- Each interview block shows: candidate name, job title, interviewer name, time, type (phone/video/onsite)
- Click block → detail modal with: candidate info, meeting link, interviewer notes, "Reschedule" and "Cancel" buttons
- "Schedule Interview" button → modal with: select candidate (search), select interviewer(s) from team, select type, select duration, pick available slot from calendar
- Integration placeholders: "Connect Google Calendar" and "Connect Outlook" buttons (show as connected/disconnected status)
- Upcoming interviews section: list view sorted by date with candidate name, job, interviewer, time, join meeting button

**Team management (`/(employer)/settings/team/page.tsx`):**
- Current team members table: name, email, role (admin/recruiter/hiring manager/viewer), status (active/invited), joined date, actions (change role, remove)
- "Invite Member" button → modal with email input and role selector
- Role descriptions shown as tooltips
- Activity log: who did what and when (e.g., "Priya moved Rahul to Interview stage — 2 hours ago")

**Candidate notes and collaboration (part of candidate detail panel from F2-3):**
- Notes section: text area to add a note, shows all notes with author name, role, timestamp
- @mention support (type @ to see team members)
- Voting system: each team member can vote on candidate — Strong Hire / Hire / No Hire / Strong No Hire
- Show all team votes as colored pills next to each voter's name
- "Decision Summary": shows consensus or disagreement

**Mock data:** 8 scheduled interviews across this week, 4 team members with different roles, notes history on 3 candidates.

---

## Prompt F2-7: Employer Analytics + Talent Pool

**Analytics dashboard (`/(employer)/analytics/page.tsx`):**
- Date range picker at top (last 7 days, 30 days, 90 days, custom)
- Row 1 — Key metrics cards: Total applicants, Interviews conducted, Offers made, Hires, Avg time-to-hire (days), Cost per hire
- Row 2 — Hiring funnel chart: horizontal funnel (Applied → Screened → AI Interviewed → Assessment → Human Interview → Offered → Hired) with counts and conversion rates between each stage
- Row 3 — Two charts side by side:
  - Left: Source analysis — bar chart showing where candidates came from (FitVector organic, shared link, referral) and quality score per source
  - Right: Time-to-hire trend — line chart over time
- Row 4 — Two tables:
  - Left: Job performance — each job post with applicants, screen rate, interview rate, hired
  - Right: Interviewer performance — each team member with interviews done, avg feedback time, calibration score
- Export button: "Download Report as CSV"

**Talent pool / CRM (`/(employer)/talent-pool/page.tsx`):**
- Table of candidates who were rejected but marked as "keep for future" or "talent pool"
- Columns: name, skills, last applied role, score, date added, tags, actions
- Tag system: employers can tag candidates (e.g., "strong frontend", "needs more experience", "great communicator")
- Search and filter by skills, tags, score range
- "Re-engage" button → opens email compose modal with "We have a new role that might interest you" template
- When a new job is posted, show a suggestion banner: "3 candidates in your talent pool match this role"

**Mock data:** 20 talent pool candidates with various tags and scores, analytics data for 90 days.

---

## Prompt F3-1: One-Click Apply + Marketplace Features

**One-click apply modal (update seeker's job detail page):**
- Jobs posted by FitVector employers show a green "Apply via FitVector" button (distinct from external job "Apply on LinkedIn" button)
- Clicking opens a modal showing:
  - Match score for this role (pre-computed)
  - Resume selector: dropdown of tailored resume versions, "Tailor new resume" button
  - Pre-filled screening questions with AI-suggested answers (editable)
  - "Why I'm interested" text area (optional, with AI assist button)
  - Review section: "You're applying as [Name] with resume [version]"
  - "Submit Application" button
- After submit: confetti animation, "Application submitted!" with "Track in Dashboard" link
- In the seeker's tracker, auto-creates entry with status "Applied via FitVector"

**Application status tracking (update seeker's tracker):**
- For FitVector applications: real-time status badges that update (Applied → Under Review → Interview Invited → Interviewed → Decision Pending → Offered/Rejected)
- Each status change shows a timeline: "Mar 22 — Applied", "Mar 23 — Under Review", "Mar 25 — Interview Invited"
- Notification bell updates when status changes

**FitVector Verified profile (`/(dashboard)/settings/verification/page.tsx`):**
- Verification checklist: identity (Aadhaar/PAN), education (degree upload), employment (offer letter), skills (pass assessment)
- Each item shows: status (not started / pending / verified / expired), action button
- Upload interface for documents
- Verified badge preview: "This is how employers will see your profile"
- Progress bar showing verification completion %

**Mock data:** 3 FitVector-posted jobs in the seeker feed with the green badge, one in-progress application with timeline updates.

---

## Prompt F3-2: Community + Salary Insights

**Interview experiences feed (`/(dashboard)/community/interviews/page.tsx`):**
- Card-based feed of anonymous interview experiences
- Each card shows: company name, role, difficulty badge (Easy/Medium/Hard), rounds count, outcome (Got Offer / Rejected / Ghosted), date
- Expand card → full experience: process description, questions asked (categorized by round), tips, overall rating
- "Share Your Experience" button → structured form: select company (search), role, number of rounds, difficulty, questions per round, tips, outcome
- Filter sidebar: company search, role filter, difficulty, outcome
- Sort: most recent, most helpful, by company
- Upvote/downvote on each experience
- Anonymous by default, optional "show name" toggle

**Discussion forums (`/(dashboard)/community/discussions/page.tsx`):**
- Category tabs: Tech, Business, Design, Marketing, Career Advice, Salary, General
- Thread list: title, author (name or "Anonymous"), replies count, last activity, category tag
- Click thread → discussion page with threaded replies (indent for replies to replies)
- "New Discussion" button → title, category, body (rich text), anonymous toggle
- Upvote on both threads and replies
- "Hot", "New", "Top" sort options

**Salary insights (`/(dashboard)/community/salaries/page.tsx`):**
- Search bar: enter role title + location
- Results show: median salary, salary range (bar showing P25 to P75), sample size
- Filter by: experience level, company size, location
- Chart: salary distribution curve for the selected role
- "Contribute Your Salary" button → anonymous form: role, company (optional), location, experience years, base salary, total comp, currency
- Comparison tool: "Your expected salary is in the [X]th percentile for this role"
- "Not enough data" message if sample size < 10

**Mock data:** 30 interview experiences across 10 companies, 20 discussion threads, salary data for 15 common roles in Bangalore/Mumbai/Remote.

---

## Prompt F3-3: Employer Branding + Promoted Listings

**Employer branding page (`/(employer)/branding/page.tsx`):**
- Company profile editor: banner image upload, company story (rich text), team photos grid, benefits list (tag-style), culture values (card grid)
- "Day in the Life" content creator: for each open role, add a short description of what a typical day looks like
- Preview: shows how the company page appears to candidates
- Stats: profile views, followers, application rate from profile

**Promoted listings (employer purchase flow):**
- On the jobs list page, each job has a "Boost" button
- Click → modal: select promotion type (sponsored feed placement, priority in search), duration (7/14/30 days), shows price (₹999/₹2,499/₹4,999), preview of how it'll look with "Sponsored" badge
- Payment section: card/UPI selector (placeholder for Razorpay)
- Active promotions dashboard: shows all boosted jobs with impressions, clicks, applications, spend

**Application boost (seeker side):**
- On the seeker's tracker, for FitVector applications: "Boost Application" button
- Click → modal explaining: "Your application will be highlighted in the employer's pipeline. The employer will see a 'Boosted' badge.", price (₹99/₹199/₹299), "Boost" button
- Credit pack purchase option: "Buy 5 boosts for ₹449 (save 10%)"
- Clearly labeled: "Boosted applications are highlighted but do not affect your match score"

**Mock data:** One company branding page fully filled out, 2 promoted job listings with performance metrics, boost credits balance for seeker.

---

# How to Use These Prompts

**Order:**
1. Run the Design System prompt first (sets up colors/fonts for everything)
2. Then run F2-1 through F2-7 sequentially for Phase 2 frontend
3. Then run F3-1 through F3-3 for Phase 3 frontend

**For each prompt:**
- Open a new or continuing coding chat
- Paste the prompt
- Attach `project-structure.md` + the relevant PRD (`prd-phase2.md` for F2 prompts, `prd-phase3.md` for F3 prompts)
- Tell Claude: "Build this with mock/hardcoded data. No real API calls. Use useState for all interactions. Follow the FitVector design system."

**After all frontend is built:**
- You'll have a complete, clickable prototype of the entire platform
- Every page works with mock data
- Backend can be wired in later by replacing mock data with real API calls
- You can demo the full product to potential users/investors even before the backend is complete
