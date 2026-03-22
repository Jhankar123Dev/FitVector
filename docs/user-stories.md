# FitVector — User Stories and Acceptance Criteria

**Version:** 1.0
**Last Updated:** March 22, 2026
**Scope:** Phase 1A, 1B, 1C

---

## Phase 1A — Core MVP

### US-1: User signup
**As a** job seeker, **I want to** create an account using Google, LinkedIn, or email, **so that** I can access FitVector.

**Acceptance criteria:**
- User can sign up via Google OAuth with one click
- User can sign up via LinkedIn OAuth with one click
- User can sign up via email/password with email verification
- Duplicate email addresses are rejected with a clear message
- After signup, user is redirected to onboarding wizard
- User record is created in the database with `user_status: onboarding`

### US-2: Onboarding wizard
**As a** new user, **I want to** tell FitVector about my career goals, **so that** I get personalized job matches.

**Acceptance criteria:**
- Wizard has 4 steps: Status → Target Role → Preferences → Resume Upload
- Step 1: Select current status (student, working, unemployed, freelancing)
- Step 1: Enter current role and company (if working)
- Step 2: Enter one or more target job titles (autocomplete suggestions)
- Step 2: Select experience level from dropdown
- Step 3: Select preferred locations (multi-select with search, includes "Remote")
- Step 3: Select work mode preference (onsite, remote, hybrid)
- Step 3: Enter expected salary range (optional, with currency selector)
- Step 4: Upload resume (PDF or DOCX, max 5MB)
- User can skip salary and resume upload steps
- Progress indicator shows which step user is on
- Back button works on all steps without losing data
- On completion, user_profiles record is created and `onboarding_completed` is set to true
- User is redirected to dashboard

### US-3: Resume upload and parsing
**As a** user, **I want to** upload my resume and have it automatically parsed, **so that** FitVector knows my skills and experience.

**Acceptance criteria:**
- Accepts PDF and DOCX files up to 5MB
- Shows upload progress indicator
- After upload, displays "Parsing your resume..." loading state (expected 5-10 seconds)
- On success, shows parsed data in editable form: summary, experience, education, skills, projects
- User can edit any parsed field before saving
- User can add/remove skills manually
- User can re-upload a different resume file
- Parsed data is stored as structured JSON in `user_profiles.parsed_resume_json`
- Skills array is also stored in `user_profiles.skills` for filtering
- Embedding is generated from parsed data and stored in `user_profiles.embedding`
- Error state: if parsing fails, show friendly error message with "Try again" button

### US-4: Job search
**As a** user, **I want to** search for jobs matching my target role, **so that** I can find opportunities to apply to.

**Acceptance criteria:**
- Search bar pre-filled with user's first target role
- Location filter pre-filled with user's first target location
- Additional filters available: work mode, job type, date posted, salary range
- Search returns results within 3 seconds (cached) or 8 seconds (fresh scrape)
- Results displayed as scrollable card list
- Each job card shows: title, company, location, posted date, source badge(s), salary (if available)
- Match score badge shows on each card (if embedding-based score is available)
- "Load more" pagination or infinite scroll
- Empty state: "No jobs found. Try adjusting your filters."
- Error state: if scraping fails, show cached results with "Results may not be current" notice
- Free tier: limited to 3 searches per day, 5 results per search
- Usage counter displayed: "2 of 3 searches used today"

### US-5: Job detail view
**As a** user, **I want to** see full details of a job, **so that** I can decide whether to apply.

**Acceptance criteria:**
- Full job description rendered (markdown formatted)
- Company info section: name, logo, size, industry, Glassdoor rating (if available)
- Skills match visualization: user's skills vs required skills (matching in green, missing in red, extra in gray)
- Action bar with 4 buttons: "Tailor Resume", "Cold Email", "LinkedIn Message", "Save to Tracker"
- "View on [Source]" link opens original job posting in new tab
- Match score displayed prominently
- "AI Gap Analysis" button (Pro+ plans, or grayed out with upgrade prompt)
- Back button returns to search results without re-fetching

### US-6: AI resume tailoring
**As a** user, **I want to** tailor my resume to a specific job description, **so that** my application is more likely to get noticed.

**Acceptance criteria:**
- Click "Tailor Resume" on any job → loading state shows "Tailoring your resume..." (expected 10-15 seconds)
- On completion, shows split view: left = editable sections, right = live PDF preview
- PDF preview is zoomable, scrollable, and looks professional
- User can accept/reject individual AI suggestions (bullet point level)
- User can manually edit any section
- "Regenerate" button re-runs AI on any section
- "Download PDF" button downloads the rendered PDF
- "Download LaTeX" button downloads the raw LaTeX source
- Resume saved with auto-generated version name: "{Company}_{Role}_{MonthYear}"
- Resume linked to the job in the database
- Usage counter incremented
- Free tier: 2 tailors/month limit enforced — shows upgrade prompt when exhausted

### US-7: Cold email generation
**As a** user, **I want to** generate a personalized cold email for a job, **so that** I can reach out to the recruiter effectively.

**Acceptance criteria:**
- Click "Cold Email" on any job → generates in 3-5 seconds
- Output shows: subject line (with 2 alternatives), email body
- Email body is 150-200 words, personalized to the specific role and company
- "Copy Subject" and "Copy Body" buttons with visual confirmation
- "Open in Gmail" and "Open in Outlook" buttons (mailto: deep links with pre-filled subject and body)
- Generated email stored in `generated_outreach` table
- If user has an application tracker entry for this job, outreach is auto-linked
- Free tier: 2 cold emails/month limit enforced

### US-8: Basic application tracker
**As a** user, **I want to** track all my job applications in one place, **so that** I don't lose track of where I applied.

**Acceptance criteria:**
- Kanban board with columns: Saved, Applied, Screening, Interview, Offer, Rejected
- Drag and drop cards between columns (updates status in database)
- Each card shows: job title, company name, company logo, date, status
- Click card → opens detail modal with: all fields, notes, linked resume version, linked outreach
- "Add manually" button: enter job title, company, URL → creates a card
- When user clicks "Apply" external link from job detail, auto-creates tracker entry in "Applied" column
- When user generates a cold email, auto-creates/updates tracker entry
- Search/filter by company name or job title
- Free tier: max 10 active (non-archived) applications
- "Archive" action moves card out of view without deleting

---

## Phase 1B — Monetization and Polish

### US-9: LinkedIn InMail generation
**As a** user, **I want to** generate a LinkedIn message to a recruiter, **so that** I can reach out professionally on LinkedIn.

**Acceptance criteria:**
- "LinkedIn Message" button on job detail view
- Generates InMail-length message (under 300 characters for connection request)
- Personalized to the specific role and company
- "Copy to Clipboard" button with confirmation
- Stored in `generated_outreach` with type `linkedin_inmail`
- Starter plan: 15/month, Pro: 50/month

### US-10: Referral request generation
**As a** user, **I want to** generate a referral request message, **so that** I can ask my connections for referrals.

**Acceptance criteria:**
- Accessible from job detail view → "Request Referral" button
- User enters: connection name, relationship context (dropdown: close colleague, former colleague, acquaintance, alumni)
- AI generates warm, non-pushy message tailored to relationship strength
- Under 350 characters for LinkedIn message format
- "Copy to Clipboard" button
- Starter: 5/month, Pro: 30/month

### US-11: Recruiter email finder
**As a** Pro user, **I want to** find the recruiter's email address for a company, **so that** I can send my cold email directly.

**Acceptance criteria:**
- "Find Recruiter" button on job detail view (Pro+ plans only)
- Shows loading state while searching (2-5 seconds)
- Returns 1-3 results with: name, email, title, confidence badge (Verified/Likely/Unknown)
- User clicks an email → auto-fills the cold email generator's recruiter field
- Results cached per company (subsequent requests for same company are instant)
- Pro: 20/month, Elite: 100/month
- Free/Starter users see grayed-out button with "Upgrade to Pro" tooltip

### US-12: Payment and subscription
**As a** user, **I want to** upgrade my plan, **so that** I can access more features and higher limits.

**Acceptance criteria:**
- Pricing page shows all 4 tiers with feature comparison table
- "Current plan" badge on user's active plan
- "Upgrade" button opens payment checkout (Razorpay for India, Stripe for international)
- Annual toggle shows 20% discounted prices
- Student discount: 40% off Pro with .edu/.ac.in email verification
- After successful payment, plan upgrades immediately (no page refresh needed)
- Usage limits reset on upgrade
- Plan management page shows: current plan, next billing date, payment history
- "Cancel subscription" button with confirmation dialog
- Cancellation takes effect at end of billing cycle (not immediate)
- Downgrade: user keeps current plan until expiry, then moves to selected lower tier

### US-13: Daily job alerts
**As a** user, **I want to** receive email notifications about new job matches, **so that** I don't miss opportunities.

**Acceptance criteria:**
- Email digest sent daily at 7:00 AM IST (if new matches exist)
- Email contains top 5 new matches with: title, company, match score, "View on FitVector" link
- User can configure frequency: daily, weekly, or off
- Starter: email only. Pro/Elite: email + PWA push notifications
- Unsubscribe link in every email
- Settings page allows toggling notification types

### US-14: PWA installation
**As a** mobile user, **I want to** install FitVector as an app on my phone, **so that** I can access it quickly.

**Acceptance criteria:**
- "Add to Home Screen" banner appears on mobile browsers after 2nd visit
- App icon and splash screen display correctly on Android and iOS
- App opens in standalone mode (no browser chrome)
- Application tracker works offline (shows cached data)
- Push notifications work when app is installed
- Service worker caches app shell for fast loading

### US-15: Additional resume templates
**As a** user, **I want to** choose from multiple resume templates, **so that** my resume matches my style.

**Acceptance criteria:**
- Template picker shows 3 options: Modern (clean, minimal), Classic (traditional), Minimal (single column)
- Preview thumbnail for each template
- Free tier: Modern only. Starter: Modern + Classic. Pro/Elite: all templates
- Template selection available during tailoring and can be changed on existing resumes
- Switching template re-compiles the same LaTeX content with different styling

---

## Phase 1C — Growth Features

### US-16: Chrome extension
**As a** Pro user, **I want to** use FitVector directly on LinkedIn, **so that** I don't need to switch between tabs.

**Acceptance criteria:**
- Extension available in Chrome Web Store
- User must log in to FitVector account through the extension popup
- On LinkedIn job pages: floating FitVector button appears
- Click button → shows match score for the job + action buttons (Tailor Resume, Cold Email, LinkedIn Msg)
- "Save to FitVector" button adds job to tracker
- On LinkedIn profile pages: "Generate Referral Request" button appears
- Extension syncs with main app in real-time (tracker updates reflect immediately)
- Pro/Elite plans only — Starter/Free users see "Upgrade" message in popup

### US-17: Detailed match score with gap analysis
**As a** Pro user, **I want to** see a detailed breakdown of why I match (or don't match) a job, **so that** I can improve my applications.

**Acceptance criteria:**
- "AI Gap Analysis" button on job detail view (Pro+ plans)
- Generates in 5-8 seconds
- Shows: matching skills with evidence, missing skills with importance, experience gaps, strengths, actionable recommendations
- Results cached (viewing the same job again shows cached results instantly)
- Pro: 20 analyses/month, Elite: unlimited

### US-18: Tracker analytics dashboard
**As a** user, **I want to** see analytics about my job search, **so that** I can understand what's working.

**Acceptance criteria:**
- Dashboard shows: total applications, this week/month, response rate
- Chart: applications over time (weekly bar chart)
- Chart: status funnel (applied → screening → interview → offer)
- Table: resume version performance (which versions got more callbacks)
- Table: top companies by applications and responses
- Starter: basic stats only. Pro/Elite: full charts and tables
- "Export CSV" button on Pro/Elite plans

### US-19: Follow-up reminders
**As a** user, **I want to** be reminded to follow up on applications, **so that** I don't let opportunities go cold.

**Acceptance criteria:**
- When creating/editing a tracker entry, user can set "Follow up on" date
- At 9:00 AM on the follow-up date: in-app notification + email + push (based on plan)
- Notification says: "Reminder: Follow up with {Company} for {Role} — applied {X} days ago"
- Smart suggestion: if no follow-up date set and application is 7+ days old with no status change, suggest setting one
- Starter: 3 active reminders. Pro/Elite: unlimited
- Completed/dismissed reminders don't count against limit

### US-20: Resume version comparison
**As a** user, **I want to** compare different versions of my tailored resume, **so that** I can pick the best one.

**Acceptance criteria:**
- Resume history page shows all versions in reverse chronological order
- "Compare" button: select 2 versions → side-by-side PDF view
- Differences highlighted (sections that changed between versions)
- Performance metrics shown if available (which version led to more callbacks)
- Free: last 2 versions visible. Starter: last 5. Pro/Elite: unlimited history

### US-21: Referral program
**As a** user, **I want to** invite friends to FitVector, **so that** we both get free Pro access.

**Acceptance criteria:**
- Unique referral link generated per user
- Share via: copy link, WhatsApp, Twitter, LinkedIn, email
- When referred user signs up and completes onboarding: both users get 7 days of Pro free
- Referral dashboard shows: total invites sent, signups, rewards earned
- Max 5 referral rewards per user (35 days of free Pro maximum)
- Reward stacks with existing plan (Pro user's expiry extends by 7 days)

---

## Definition of Done (applies to all stories)

A user story is complete when:
1. Feature works as described in all acceptance criteria
2. Feature works on desktop (Chrome, Firefox, Safari) and mobile (Chrome Android, Safari iOS)
3. Loading states are shown for all async operations
4. Error states are handled with user-friendly messages
5. Plan limits are enforced correctly (upgrade prompt shown when exceeded)
6. Data persists correctly in database (verified via Supabase dashboard)
7. No console errors in browser or server logs
8. Responsive layout: works at 320px (mobile) through 1920px (desktop)
9. Accessibility: keyboard navigable, proper ARIA labels on interactive elements
10. Code reviewed and merged to main branch

---

*User stories for Phase 2 (Employer) and Phase 3 (Marketplace) will be added in separate sections when those phases begin development.*
