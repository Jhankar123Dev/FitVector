# FitVector — Product Requirements Document
## Phase 2: Employer / Hiring Portal

**Version:** 1.0
**Date:** March 22, 2026
**Author:** FitVector Product Team
**Status:** Draft
**Dependency:** Phase 1 (Job Seeker Platform) must be live with active user base

---

## 1. Product overview

### 1.1 Vision
Phase 2 transforms FitVector from a single-sided job seeker tool into a two-sided hiring platform. Employers get an AI-powered hiring command center that handles the entire top-of-funnel: posting jobs, screening resumes intelligently, conducting AI-powered first-round interviews, scheduling human interviews, and ranking candidates — all with humans firmly in the loop for final decisions.

FitVector builds its own AI interviewer and screening engine from the ground up (inspired by Fabric's approach but fully owned). This gives complete control over the technology, avoids third-party dependency, and enables the data flywheel between the job seeker and employer sides.

### 1.2 Problem statement
Employers — from startups to enterprises — face painful hiring bottlenecks:
- Reviewing hundreds of resumes per role manually takes 20-30 hours per hire
- 75% of resumes received are unqualified, wasting recruiter time on noise
- First-round screening calls are repetitive, expensive, and inconsistent across interviewers
- Interview scheduling is a back-and-forth email nightmare averaging 5-7 days to coordinate
- Recruiters lack standardized, data-driven evaluation frameworks — decisions are often gut-feel
- Existing solutions (Greenhouse, Lever, Workday) are expensive ($5,000-50,000+/year) and require complex setup

### 1.3 Solution
FitVector's employer platform provides:
1. **Smart job posting** — Post once, distribute to FitVector's job seeker network + external boards
2. **AI resume screening** — Goes beyond keyword matching to evaluate skill fit, experience relevance, and potential — ranks every applicant automatically
3. **AI interviewer** — Conducts real-time, conversational first-round interviews (voice-based) that adapt to candidate responses, ask follow-ups, and evaluate depth of knowledge
4. **AI cheating detection** — Identifies candidates using AI tools to answer interview questions via 20+ behavioral signals
5. **Candidate ranking and reports** — Detailed evaluation reports per candidate covering technical skills, soft skills, communication, and cultural fit
6. **Interview scheduling** — Automated scheduling for human interview rounds with calendar integration
7. **Hiring pipeline management** — Visual pipeline from application to offer with team collaboration
8. **Human-in-the-loop always** — AI screens and recommends; humans decide and hire

### 1.4 Target users
- **Startup founders / CTOs** — Hiring their first 10-50 employees, no dedicated HR
- **HR managers / recruiters** at SMBs — Managing 5-20 open roles simultaneously
- **Enterprise talent acquisition teams** — High-volume hiring (50-500+ hires/quarter)
- **Recruiting / staffing agencies** — Screening candidates for multiple clients
- Geography: India-first (matching Phase 1), expanding globally

---

## 2. Tech stack (additions to Phase 1)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| AI Interviewer — Voice | WebRTC + Deepgram (STT) + ElevenLabs/PlayHT (TTS) | Real-time voice conversations with low latency |
| AI Interviewer — Brain | Claude API (Anthropic) | Dynamic question generation, follow-up logic, evaluation |
| AI Cheating Detection | Custom ML pipeline (Python) | Analyzes response patterns, timing, linguistic signals |
| Resume Screening AI | Claude API + embedding model | Semantic matching beyond keywords |
| Interview Scheduling | Cal.com (open-source) or Calendly API | Google Calendar + Outlook integration |
| Video (future) | Daily.co or 100ms SDK | For video-based AI interviews in later iterations |
| Email Transactional | Resend or AWS SES | Candidate communications, scheduling emails |
| Team Collaboration | Real-time via Supabase Realtime | Multi-recruiter notes, evaluations, comments |
| PDF Report Generation | Puppeteer or react-pdf | Candidate evaluation reports |

---

## 3. Feature specifications

### 3.1 Employer onboarding

**Flow:**
1. Employer signs up (Google Workspace, LinkedIn, or email)
2. Company profile setup:
   - Company name, logo, website URL
   - Industry, company size (1-10, 11-50, 51-200, 201-1000, 1000+)
   - Company description (AI can help write this from website URL)
   - Culture keywords / values (used by AI in cultural fit evaluation)
   - Office locations
3. Team setup:
   - Invite team members (recruiter, hiring manager, interviewer roles)
   - Role-based permissions (admin, recruiter, hiring manager, viewer)
4. First job post creation (guided wizard)

### 3.2 Job posting system

**Creating a job post:**
- Title, department, location (city/remote/hybrid)
- Job type (full-time, part-time, contract, internship)
- Experience range, salary range (optional, can be hidden from candidates)
- Full job description (rich text editor)
- "AI Assist" button: paste rough notes → Claude generates a professional JD
- Required skills (tags) + nice-to-have skills (tags)
- Number of openings
- Application deadline (optional)
- Custom screening questions (up to 5 multiple-choice or short-answer)

**Distribution:**
- Auto-listed on FitVector's job seeker platform (instant reach to Phase 1 user base)
- Shareable job link for external posting
- Future: one-click distribution to LinkedIn, Naukri, Indeed via API partnerships

**Job dashboard:**
- All active/paused/closed jobs in one view
- Per-job stats: total applicants, screened, interviewed, in-pipeline, hired
- Quick actions: pause, close, duplicate, edit

### 3.3 AI resume screening engine

**How it works:**

This is FitVector's core screening intelligence — built from scratch, not a wrapper around keyword matching.

**Step 1 — Intake:**
- Candidates apply via FitVector (Phase 1 users clicking "Apply") or employer shares external application link
- Resume uploaded (PDF/DOCX) + optional cover letter
- Custom screening question responses captured

**Step 2 — Parsing and structuring:**
- AI extracts structured data from resume: skills, experience timeline, education, projects, certifications, achievements
- Handles diverse resume formats (Indian resumes with photos, international formats, academic CVs)
- Parsed data stored as structured JSON for fast comparison

**Step 3 — Multi-dimensional scoring:**
The screening engine evaluates each candidate across 6 dimensions:

| Dimension | Weight (configurable by employer) | What AI evaluates |
|-----------|-----------------------------------|-------------------|
| Skill match | 30% | Hard skills overlap with JD requirements, proficiency signals from project descriptions |
| Experience relevance | 25% | Years of experience, domain relevance, role progression, company tier |
| Education fit | 10% | Degree relevance, institution quality (optional, can be turned off for DEI) |
| Achievement signals | 15% | Quantified achievements, impact metrics, leadership indicators |
| Cultural keywords | 10% | Alignment with company values/culture keywords defined in employer profile |
| Screening questions | 10% | Quality of custom screening question responses |

**Step 4 — Ranking and bucketing:**
- Each candidate receives a composite score (0-100)
- Auto-bucketed into: Strong fit (80-100), Good fit (60-79), Potential fit (40-59), Weak fit (0-39)
- Employer sees ranked list with score breakdown per dimension
- One-click actions: "Advance to AI Interview", "Reject", "Maybe Later"

**Step 5 — AI summary per candidate:**
- 3-4 sentence summary: "This candidate has 4 years of React experience at mid-tier companies. Strong skill match (92%) but limited experience with your specific tech stack (GraphQL, AWS). Notable: led a team of 3 on a product that grew to 50K users. Recommended for AI interview to assess depth."
- Highlighted strengths and gaps
- Comparison to other applicants in the same pool

**Employer controls:**
- Adjust dimension weights per job (e.g., a startup might weight cultural fit higher)
- Set auto-advance threshold: "Automatically send AI interview invite to candidates scoring 75+"
- Set auto-reject threshold: "Auto-reject candidates below 30" (with configurable rejection email)
- Toggle education scoring on/off (DEI consideration)
- Blocklist/allowlist specific companies, schools, or skill keywords

### 3.4 AI interviewer

**This is FitVector's flagship employer feature — a conversational AI that conducts first-round interviews.**

**Interview types supported:**
- Technical screening (coding concepts, system design, domain knowledge)
- Behavioral / situational (STAR method questions, scenario responses)
- Role-specific (sales pitch simulation, case studies, portfolio review discussion)
- General screening (motivation, availability, salary expectations, notice period)

**How the AI interview works:**

**Pre-interview setup (employer configures once per job):**
- Select interview type(s) and duration (15, 20, or 30 minutes)
- Define focus areas: "Assess React proficiency, system design thinking, and communication"
- Add custom must-ask questions (up to 3)
- Set difficulty level: junior, mid, senior
- AI auto-generates the remaining interview structure from the JD
- Employer can preview and edit the generated interview plan

**Candidate experience:**
1. Candidate receives email/SMS invite: "Complete your AI interview for [Role] at [Company]"
2. Clicks link → lands on FitVector interview page
3. Quick system check (microphone, internet, browser compatibility)
4. Brief intro screen: explains the process, sets expectations, reassures it's conversational
5. Interview begins — AI introduces itself, asks first question
6. Candidate responds verbally → speech-to-text → AI processes → generates follow-up
7. AI adapts in real-time:
   - If answer is vague → asks for specific examples
   - If answer is strong → goes deeper with harder follow-ups
   - If candidate struggles → pivots to a different angle, maintains encouraging tone
   - If candidate gives textbook answer → probes for real experience vs memorized content
8. Interview concludes → candidate gets a thank-you screen with expected timeline
9. Available 24/7 — candidates can interview at 2 AM on a Sunday if they want

**Technical architecture of AI interviewer:**

```
Candidate speaks
    ↓
Deepgram (Speech-to-Text, real-time streaming)
    ↓
Claude API (Interview brain)
- Receives: full conversation transcript so far + JD + interview plan + evaluation rubric
- Generates: next question OR follow-up OR transition to new topic
- Maintains: running evaluation notes per competency
    ↓
ElevenLabs/PlayHT (Text-to-Speech)
    ↓
Audio streamed back to candidate via WebRTC
    ↓
Loop continues until interview duration reached
    ↓
Post-interview: Claude generates comprehensive evaluation report
```

**Latency target:** Under 1.5 seconds from candidate finishing speaking to AI starting to respond. This requires streaming STT, streaming Claude output, and streaming TTS — all pipelined.

**AI cheating detection (integrated, not separate):**
FitVector's AI interviewer detects cheating through behavioral signals, not invasive methods. No gaze tracking, no app downloads, no webcam requirements (for voice interviews).

Detection signals (20+):
- Response latency patterns: unnaturally fast responses to complex questions suggest pre-written answers
- Linguistic analysis: sudden shifts in vocabulary complexity, style inconsistency between answers
- Background audio analysis: keyboard typing sounds during responses, secondary voice detected
- Copy-paste indicators: responses that match common ChatGPT/Claude output patterns
- Depth probing: when AI asks unexpected follow-ups, AI-assisted candidates often can't elaborate naturally
- Consistency checking: cross-referencing earlier answers with later ones for contradictions
- Technical verification: asking candidates to explain their own stated experience in conversational detail

Each signal contributes to a "confidence score" (not a binary flag). The report shows: "AI assistance suspected: Low / Medium / High" with specific evidence. Employer makes the final judgment.

**What the AI interviewer does NOT do:**
- Does NOT evaluate based on appearance, accent, tone of voice, or speaking pace
- Does NOT penalize non-native English speakers for grammar
- Does NOT use facial expression analysis
- Does NOT factor in race, gender, age, religion, or personal beliefs
- Evaluation is purely knowledge-based and skill-based

### 3.5 Candidate evaluation reports

**Generated after each AI interview. This is the primary deliverable employers pay for.**

**Report contents:**

**1. Executive summary (2-3 sentences)**
"Priya demonstrated strong React knowledge with hands-on experience in state management and component architecture. Her system design thinking is developing — she proposed reasonable solutions but missed scalability considerations. Communication was clear and structured. Recommended for a human technical round focused on system design depth."

**2. Skill-wise ratings (per competency defined in interview plan)**
- Each skill rated 1-5 with a brief justification
- Visual radar/spider chart showing strengths and gaps
- Example: React (4.5/5) — "Explained hooks lifecycle clearly, referenced real project experience with custom hooks"
- Example: System Design (2.5/5) — "Proposed a monolithic solution, didn't consider caching or load balancing when prompted"

**3. Strengths (top 3)**
- Bullet points with specific evidence from the interview

**4. Areas of concern (top 3)**
- Bullet points with specific evidence
- Not framed as weaknesses — framed as areas to probe in the next round

**5. AI cheating assessment**
- Confidence level: Low / Medium / High
- Specific signals detected (if any)
- Recommendation: "No concerns detected" or "Recommend verifying [specific topic] in human round"

**6. Communication and personality insights**
- Structured thinking (did they organize answers logically?)
- Clarity of explanation (could they explain complex topics simply?)
- Curiosity (did they ask questions, show genuine interest?)
- Confidence level (not penalized for nervousness — noted for context)

**7. Full transcript**
- Time-stamped, searchable
- AI-generated highlights on key moments
- Employer can click any moment to read the exchange

**8. Recording (audio)**
- Full audio recording available for playback
- Speed controls (1x, 1.5x, 2x)

**9. Comparison view**
- Side-by-side comparison with other candidates for the same role
- Normalized scores across candidates

### 3.6 Interview scheduling (human rounds)

**After AI interview, candidates advance to human rounds. FitVector automates scheduling.**

**Flow:**
1. Employer clicks "Schedule Human Interview" on a candidate
2. Selects interviewer(s) from team + interview type + duration
3. System checks interviewer availability (Google Calendar / Outlook integration via Cal.com)
4. Sends candidate an email with available time slots
5. Candidate picks a slot → confirmation sent to both parties
6. Calendar event auto-created with video call link (Google Meet / Zoom)
7. Reminder emails sent 24h and 1h before interview
8. Post-interview: interviewer fills out a structured feedback form in FitVector

**Scheduling features:**
- Multi-round scheduling: define interview stages (HR screen → technical → culture fit → hiring manager)
- Panel interviews: book multiple interviewers for the same slot
- Automatic rescheduling if interviewer cancels
- Candidate self-service rescheduling (within employer-defined window)
- Time zone auto-detection for remote interviews
- Buffer time between interviews (configurable: 15/30/60 min)

### 3.7 Hiring pipeline management

**Visual pipeline (similar to a CRM deal pipeline):**

```
Applied → AI Screened → AI Interviewed → Human Interview → Offer → Hired
                                    ↘ Rejected (at any stage)
                                    ↘ On Hold
```

**Pipeline features:**
- Drag-and-drop candidates between stages
- Bulk actions: advance, reject, email, schedule
- Stage-specific actions: "Send AI interview invite" appears only in "AI Screened" stage
- Filters: by score range, skills, experience, location, date applied
- Team collaboration:
  - @mention teammates on candidate cards
  - Shared notes and comments per candidate
  - Thumbs up/down voting by multiple interviewers
  - Hiring decision: "Strong Hire / Hire / No Hire / Strong No Hire" per team member
- Activity log: full history of every action taken on every candidate
- Rejection management:
  - Customizable rejection email templates
  - Auto-send or manual send options
  - Warm rejection: "We'll keep your profile for future roles" (adds to talent pool)

### 3.8 Employer dashboard and analytics

**Overview dashboard:**
- Active jobs count, total applicants, interviews this week
- Hiring funnel metrics: applicants → screened → interviewed → offered → hired (with conversion rates)
- Average time-to-hire per role
- Top performing job posts (by applicant quality, not just volume)

**Analytics deep dives:**
- Source analysis: where are the best candidates coming from? (FitVector organic, shared link, referral)
- Screening efficiency: how many candidates does AI correctly advance vs employer override?
- Interview completion rate: what % of invited candidates complete the AI interview?
- Diversity metrics (optional, anonymized): gender, experience level distribution in pipeline
- Team performance: interviewer feedback turnaround time, calibration scores

### 3.9 Talent pool / CRM

- Rejected candidates who were "close" get added to talent pool
- Employers can tag and categorize pool candidates
- When a new similar role opens, AI suggests relevant candidates from the pool
- Re-engagement emails: "Hi [name], we have a new role that might interest you"

---

## 4. Pricing structure — Employer side

### 4.1 Tier design — 4 tiers

| Feature | Starter (Free) | Growth (₹4,999/mo) | Business (₹14,999/mo) | Enterprise (Custom) |
|---------|----------------|--------------------|-----------------------|---------------------|
| Active job posts | 2 | 10 | 50 | Unlimited |
| AI resume screening | 50 resumes/mo | 500 resumes/mo | 5,000 resumes/mo | Unlimited |
| AI interviews | 5/month | 50/month | 500/month | Unlimited |
| Team members | 1 (admin only) | 5 | 20 | Unlimited |
| Interview scheduling | Manual only | Google Cal integration | Google + Outlook + Zoom | Custom integrations |
| Candidate reports | Basic summary | Full report | Full + comparison view | Full + API export |
| Cheating detection | Basic | Advanced (20+ signals) | Advanced + evidence | Advanced + audit log |
| Pipeline management | Basic kanban | Full pipeline + filters | Full + collaboration | Full + custom stages |
| Talent pool / CRM | No | 100 candidates | Unlimited | Unlimited + API |
| Analytics | Basic stats | Full dashboard | Full + export | Custom + BI integration |
| Employer branding | FitVector branding | Co-branded | White-label interview page | Fully white-labeled |
| Support | Community | Email | Priority email + chat | Dedicated account manager |
| ATS integration | No | No | Greenhouse, Lever API | Custom integrations |
| SLA | No | No | 99.5% uptime | 99.9% + custom SLA |

### 4.2 Pricing notes
- Starter is free forever — lets small startups try FitVector with real hiring
- Growth is the sweet spot for startups hiring 2-5 people/month
- Business targets mid-size companies and agencies
- Enterprise is quote-based, includes dedicated onboarding, custom AI training on company's historical hiring data
- Annual plans: 20% discount across all tiers
- Usage-based add-ons: additional AI interviews at ₹99/interview beyond plan limit
- International pricing: PPP-adjusted (matching Phase 1 strategy)

---

## 5. Database schema (additions for Phase 2)

### Companies
- id (UUID, PK)
- name, logo_url, website_url
- industry, company_size
- description
- culture_keywords (text array)
- locations (JSONB array)
- created_by (FK → Users)
- plan_tier, plan_expiry
- created_at, updated_at

### Company_Members
- id (UUID, PK)
- company_id (FK → Companies)
- user_id (FK → Users)
- role (admin, recruiter, hiring_manager, viewer)
- invited_by (FK → Users)
- status (invited, active, deactivated)
- created_at

### Job_Posts (employer-created, distinct from scraped Jobs table)
- id (UUID, PK)
- company_id (FK → Companies)
- created_by (FK → Users)
- title, department, location, is_remote, job_type
- experience_min, experience_max
- salary_min, salary_max, salary_currency, salary_visible (boolean)
- description (rich text)
- required_skills (text array)
- nice_to_have_skills (text array)
- screening_questions (JSONB array)
- openings_count
- application_deadline
- interview_plan (JSONB — AI interview configuration)
- status (draft, active, paused, closed, filled)
- auto_advance_threshold (integer, 0-100)
- auto_reject_threshold (integer, 0-100)
- dimension_weights (JSONB — custom weights for screening dimensions)
- created_at, updated_at

### Applicants
- id (UUID, PK)
- job_post_id (FK → Job_Posts)
- user_id (FK → Users, nullable — for FitVector users)
- name, email, phone
- resume_url, resume_parsed_json (JSONB)
- screening_responses (JSONB)
- source (fitvector_organic, external_link, referral, imported)
- screening_score (0-100)
- screening_breakdown (JSONB — per-dimension scores)
- screening_summary (text — AI-generated)
- bucket (strong_fit, good_fit, potential_fit, weak_fit)
- pipeline_stage (applied, ai_screened, ai_interviewed, human_interview, offer, hired, rejected, on_hold)
- rejection_reason (text, nullable)
- talent_pool (boolean, default false)
- talent_pool_tags (text array)
- created_at, updated_at

### AI_Interviews
- id (UUID, PK)
- applicant_id (FK → Applicants)
- job_post_id (FK → Job_Posts)
- interview_type (technical, behavioral, role_specific, general)
- duration_planned (minutes)
- duration_actual (minutes)
- status (invited, started, completed, expired, cancelled)
- invite_sent_at, started_at, completed_at
- invite_expires_at
- transcript (JSONB — timestamped array of speaker turns)
- audio_recording_url
- evaluation_report (JSONB — full structured report)
- overall_score (0-100)
- skill_scores (JSONB — per-competency scores)
- strengths (JSONB array)
- concerns (JSONB array)
- cheating_confidence (low, medium, high)
- cheating_signals (JSONB array)
- communication_assessment (JSONB)
- ai_recommendation (strong_advance, advance, borderline, reject)
- created_at

### Human_Interviews
- id (UUID, PK)
- applicant_id (FK → Applicants)
- job_post_id (FK → Job_Posts)
- interviewer_id (FK → Users)
- round_number (integer)
- interview_type (text)
- scheduled_at (timestamp)
- duration_minutes
- meeting_link
- calendar_event_id
- status (scheduled, completed, cancelled, rescheduled, no_show)
- feedback (JSONB — structured feedback form)
- rating (strong_hire, hire, no_hire, strong_no_hire)
- notes (text)
- created_at, updated_at

### Employer_Usage
- id (UUID, PK)
- company_id (FK → Companies)
- action_type (resume_screen, ai_interview, job_post, etc.)
- month_year
- count (integer)

---

## 6. AI interviewer — Technical deep dive

### 6.1 Conversation state machine

```
INIT → INTRODUCTION → QUESTION_LOOP → WRAP_UP → EVALUATION

QUESTION_LOOP:
  Ask question
      ↓
  Listen to response
      ↓
  Evaluate: sufficient depth?
      ├── No → Ask follow-up (max 2 follow-ups per topic)
      └── Yes → Transition to next topic
      
  Check: time remaining?
      ├── > 5 min → Continue QUESTION_LOOP
      └── ≤ 5 min → Move to WRAP_UP
```

### 6.2 Prompt architecture

The AI interviewer uses a multi-layer prompt structure:

**Layer 1 — System prompt (constant):**
Defines the AI's persona, interview etiquette, evaluation framework, and hard rules (no bias, no appearance-based evaluation, maintain encouraging tone).

**Layer 2 — Job context (per job):**
Full JD, required skills, interview plan, focus areas, custom questions, difficulty level, company culture keywords.

**Layer 3 — Candidate context (per interview):**
Parsed resume data, screening score, screening summary, any red flags to probe.

**Layer 4 — Conversation history (growing):**
Full transcript of the current interview. Sent with every API call so Claude has complete context.

**Layer 5 — Evaluation rubric (per skill):**
What a 1/5 vs 5/5 looks like for each competency being assessed. Grounded in specific behavioral indicators, not vague descriptors.

### 6.3 Voice pipeline optimization

To achieve < 1.5s response latency:
- Deepgram streaming STT (not batch) — transcribes as candidate speaks
- Endpointing detection: 1.2s silence = candidate finished speaking
- Claude API with streaming enabled — start TTS as soon as first sentence is complete
- ElevenLabs streaming TTS — begins speaking before Claude finishes generating
- Pre-warm TTS connection at interview start
- Total pipeline: STT finalization (200ms) + Claude first token (300-500ms) + TTS first audio (200-300ms) = ~700-1000ms

### 6.4 Handling edge cases
- Candidate goes silent for > 10 seconds → AI gently prompts: "Take your time. Would you like me to rephrase the question?"
- Candidate gives one-word answers → AI asks for elaboration, then moves on if still brief
- Candidate asks AI to repeat → AI rephrases the question (doesn't repeat verbatim)
- Candidate asks about salary/benefits → AI provides info from employer-configured FAQ, or says "The recruiter will discuss specifics with you"
- Candidate asks off-topic questions → AI politely redirects to the interview
- Internet drops → Session pauses, candidate can resume within 30 minutes
- Candidate uses offensive language → AI notes it in report, maintains professional tone, continues

---

## 7. Integration points between Phase 1 and Phase 2

### 7.1 The data flywheel

This is FitVector's strategic moat — the connection between both sides:

**Job seeker → Employer:**
- When a Phase 1 user clicks "Apply" on a FitVector-posted job, their tailored resume + profile flows directly into the employer's applicant pipeline
- No re-uploading, no form filling — employer instantly gets structured candidate data
- The resume the seeker tailored using FitVector's AI is the exact resume the employer's AI screens

**Employer → Job seeker:**
- Jobs posted by employers appear in the Phase 1 job aggregation feed with a "FitVector Verified" badge
- These jobs have richer data (verified salary, accurate JD, company culture info) than scraped jobs
- Candidates get priority consideration when applying to FitVector-posted jobs vs external applications

**Analytics flywheel:**
- FitVector knows which resume adjustments led to higher screening scores
- This data improves the resume tailoring AI over time
- FitVector knows which cold email styles led to responses — improves outreach generation
- Employer screening patterns improve the match score algorithm for job seekers

### 7.2 Shared infrastructure
- Same user accounts (a person can be both a job seeker and an employer)
- Same PostgreSQL database with shared Users table
- Same auth system (NextAuth)
- Same AI backbone (Claude API)
- Employer features accessed via /employer/* routes in the same Next.js app

---

## 8. MVP scope — Phase 2 sub-phases

### Phase 2A — Core Employer MVP (Week 1-8)
- Employer signup and company profile
- Job posting (manual, single job at a time)
- AI resume screening (parsing + scoring + ranking)
- Candidate pipeline (basic kanban)
- Candidate summary reports (text-based, no radar charts yet)
- Connection to Phase 1: FitVector users can apply, resume flows automatically
- Starter (free) + Growth tier

### Phase 2B — AI Interviewer (Week 9-16)
- Voice-based AI interviewer (technical + behavioral types)
- Real-time conversation with < 1.5s latency
- Post-interview evaluation reports
- Cheating detection (basic signals)
- Interview invite system (email)
- Audio recording + transcript
- Business tier

### Phase 2C — Scheduling + Collaboration (Week 17-22)
- Google Calendar + Outlook integration for human interviews
- Automated scheduling with candidate self-service
- Team collaboration (multi-user notes, voting, @mentions)
- Candidate comparison view
- Talent pool / CRM
- Advanced analytics dashboard
- Enterprise tier (custom pricing)

---

## 9. Success metrics — Phase 2

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Registered companies | 500 |
| Active job posts | 1,500 |
| AI interviews conducted | 10,000 |
| Employer free → paid conversion | 10-15% |
| Average time-to-first-screen | Under 2 hours (vs industry 3-5 days) |
| AI interview completion rate | 70%+ of invited candidates |
| Employer NPS | 45+ |
| Candidates hired via FitVector | 200+ |
| Screening accuracy (employer agrees with AI ranking) | 80%+ |

---

## 10. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI interviewer latency too high | High — poor candidate experience | Streaming pipeline, pre-warm connections, fallback to text chat if voice latency > 3s |
| Cheating detection false positives | High — unfair to candidates | Conservative thresholds, always flag (never auto-reject), human reviews all "high" flags |
| Employers don't trust AI screening | High — low adoption | Show AI reasoning for every score, allow easy override, build trust gradually with accurate recommendations |
| Voice interview accessibility | Medium — excludes some users | Offer text-based interview alternative for hearing-impaired candidates or poor connectivity |
| Claude API costs for interviews | High — 15-30 min conversations are expensive | Cache common question patterns, optimize token usage, set interview duration limits per plan |
| Candidate refuses AI interview | Medium — reduces pipeline | Always frame as optional first round; employers can skip directly to human interview |
| Enterprise sales cycle is long | Medium — slow revenue | Focus on self-serve startups/SMBs first; enterprise is an upsell, not the launch target |

---

*Phase 2 connects FitVector's job seekers directly to employers, creating a two-sided hiring marketplace with AI at every touchpoint. Phase 3 will close the loop with one-click applications and marketplace features.*
