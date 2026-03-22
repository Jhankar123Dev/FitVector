# FitVector — Product Requirements Document
## Phase 3: Marketplace, One-Click Apply & Community

**Version:** 1.0
**Date:** March 22, 2026
**Author:** FitVector Product Team
**Status:** Draft
**Dependency:** Phase 1 (Job Seekers) and Phase 2 (Employers) must be live with active users on both sides

---

## 1. Product overview

### 1.1 Vision
Phase 3 transforms FitVector from two separate tools into a unified hiring marketplace. Job seekers apply to employer-posted jobs with a single click — their AI-tailored resume, profile data, and match score flow directly into the employer's hiring pipeline. No external forms, no re-uploading resumes, no ATS friction. This is where FitVector's two-sided data flywheel reaches full speed.

Phase 3 also introduces community features, a revenue-sharing marketplace model, and advanced platform intelligence that makes both sides progressively smarter.

### 1.2 What Phase 3 unlocks
- **For job seekers:** One-click apply to FitVector-posted jobs. Your profile, tailored resume, and match score are pre-packaged — employers see you as a complete, evaluated candidate instantly.
- **For employers:** Higher-quality applicant flow. Candidates who apply via FitVector arrive pre-screened with structured data, saving hours of resume review.
- **For FitVector:** A marketplace revenue model (per-qualified-applicant fees, premium placements) on top of existing SaaS subscriptions. Network effects where more employers attract more seekers, and vice versa.

---

## 2. Feature specifications

### 2.1 One-click apply via FitVector

**The core marketplace feature.**

**How it works — Job seeker perspective:**

1. User browses jobs on FitVector (same Phase 1 experience)
2. Jobs posted by FitVector employers show a green "Apply via FitVector" badge (distinct from scraped external jobs)
3. User clicks "Apply via FitVector" on a job
4. A pre-apply modal appears showing:
   - Their current match score for this role (from embedding-based scorer)
   - Which resume version will be sent (last tailored version for this JD, or master resume)
   - Option to quickly tailor resume before applying (if they haven't already)
   - Pre-filled screening question responses (AI suggests answers based on their profile, user confirms/edits)
   - Optional: short "why I'm interested" note (AI-assisted, 2-3 sentences)
5. User clicks "Submit Application" — done in under 30 seconds
6. Application appears in their tracker automatically as "Applied via FitVector"
7. User gets real-time status updates as employer processes their application (screened, interview invite, etc.)

**How it works — Employer perspective:**

1. Application arrives in their pipeline with a "FitVector Verified" badge
2. Candidate card shows:
   - Pre-calculated match score (already computed, no wait)
   - Structured profile data (skills, experience, education — already parsed)
   - Tailored resume PDF (already rendered)
   - Screening question responses
   - "Why I'm interested" note
   - FitVector activity signals: how active is this candidate? Are they applying broadly or selectively?
3. Employer can immediately advance to AI interview or human interview — no manual screening needed for high-match candidates
4. If auto-advance is configured (score > threshold), candidate automatically receives AI interview invite

**What makes this different from Indeed/LinkedIn "Easy Apply":**
- Resume is AI-tailored to the specific JD, not a generic upload
- Match score is pre-computed and visible to employer
- Structured data (not just a PDF blob) — employer's AI can immediately evaluate
- Bi-directional status tracking — seeker sees where they are in real-time
- Quality signal: candidates who invest in tailoring through FitVector are higher-intent than spray-and-pray applicants

### 2.2 Candidate quality signals

**New data layer that emerges from marketplace activity:**

**For employers to see (anonymized and aggregated):**
- Application selectivity score: does this candidate apply to 5 jobs or 500? (Selective = higher intent)
- Profile completeness: % of FitVector profile filled out
- Platform tenure: how long has the candidate been active?
- Resume tailoring effort: did they tailor specifically for this role?
- Response rate: when contacted, how quickly do they respond?

**For job seekers to see:**
- Employer response rate: "This company responds to 85% of FitVector applicants within 3 days"
- Average time-to-hire via FitVector for this company
- Interview process transparency: "Typically 3 rounds over 2 weeks"
- Candidate satisfaction score (from post-interview feedback)

### 2.3 Smart matching and recommendations

**Goes beyond Phase 1's embedding-based scoring with marketplace intelligence:**

**For job seekers:**
- "Recommended for you" feed powered by:
  - Profile-JD embedding similarity (Phase 1)
  - Historical success patterns: "Candidates with your profile got interviews at these companies"
  - Employer responsiveness: prioritize companies that actually respond on FitVector
  - Salary alignment: only show jobs within ±20% of expected salary
  - Skill gap opportunities: "You're 1 skill away from qualifying for Senior roles — consider learning [X]"
- "Hot jobs" badge: roles where employer is actively reviewing applications right now
- "Fast track" badge: roles with auto-advance enabled (high-scoring candidates get instant AI interview)

**For employers:**
- "Recommended candidates" from the talent pool when a new job is posted
- "Similar to your best hires" — ML model trained on employer's historical hiring decisions
- Passive candidate surfacing: "These candidates haven't applied but are a 90%+ match — invite them to apply"
- Proactive alerts: "A top-match candidate just became active on FitVector — reach out?"

### 2.4 FitVector verified profiles

**A trust layer for the marketplace:**

- Job seekers can earn a "FitVector Verified" badge on their profile
- Verification includes:
  - Identity verification (Aadhaar/PAN for India, government ID for international)
  - Education verification (degree certificate upload + AI validation)
  - Employment verification (offer letter or payslip for current/last role)
  - Skill verification (pass FitVector's own AI skill assessments)
- Verified profiles get:
  - Priority in employer search results
  - Higher visibility in "Recommended candidates"
  - A trust badge visible to employers
  - Access to exclusive "verified only" job posts from premium employers
- Employer benefit: reduced risk of fraudulent candidates, faster hiring decisions

### 2.5 Community features

**Now that critical mass exists, introduce community as a growth and retention lever.**

**Job seeker community:**
- **Interview experiences:** Anonymous, Glassdoor-style reports: "I interviewed at [Company] for [Role]. The process had 3 rounds..."
  - Structured format: difficulty level, questions asked (categorized), outcome, tips
  - AI-moderated for quality and to prevent fake reviews
  - Searchable by company, role, and interview type
- **Resume reviews:** Peer-to-peer resume feedback (anonymized)
  - Post your resume (auto-redacted for PII) → community members give feedback
  - AI-assisted feedback suggestions to help reviewers give useful input
  - Karma/reputation system for helpful reviewers
- **Discussion forums:**
  - Organized by domain: tech, business, design, marketing, etc.
  - Job market trends, salary negotiations, career advice
  - AI-moderated for spam and toxicity
  - Weekly "Ask Me Anything" with industry professionals (curated by FitVector)
- **Salary insights:**
  - Anonymized salary data contributed by FitVector users
  - Filtered by role, location, experience, company size
  - Benchmarking tool: "Your expected salary for [Role] in [City] at [X years] is in the [percentile] range"

**Employer community:**
- Employer branding pages: culture content, team stories, benefits showcase
- "Day in the life" content for open roles
- Employer Q&A: candidates can ask questions, employer team responds
- Hiring best practices forum (moderated by FitVector)

### 2.6 Advanced analytics and insights

**Platform-level intelligence available to both sides:**

**For job seekers (Pro+ tiers):**
- Market demand heatmap: which skills are trending up/down in their domain?
- Salary negotiation data: "For this role at this company size, 80% of offers are between ₹X-Y"
- Application performance analytics:
  - Which resume version performs best?
  - Which outreach template gets the most responses?
  - What day/time do applications get the most views?
  - How does the user compare to other applicants for the same roles?

**For employers (Business+ tiers):**
- Hiring market intelligence: supply/demand for specific skills in their location
- Compensation benchmarking: where does their offer stack up vs market?
- Pipeline health metrics: conversion rates at each stage, bottlenecks
- Predictive analytics: "Based on current pipeline, estimated 3 more weeks to fill this role"
- Diversity pipeline analysis (anonymized, optional)

---

## 3. Marketplace revenue model

### 3.1 Revenue streams (in addition to existing SaaS subscriptions)

**Stream 1 — Promoted job listings (employer pays)**
- Employers pay to boost their job posts in the seeker feed
- "Sponsored" badge, priority placement in search results and recommendations
- Pricing: ₹999-4,999 per promoted listing for 7/14/30 days
- Self-serve purchase through employer dashboard

**Stream 2 — Per-qualified-applicant pricing (optional add-on)**
- Employers can opt into "pay per qualified applicant" model
- FitVector charges ₹199-499 per applicant who scores above the employer's threshold
- Only charged when an applicant is advanced past AI screening (not for every application)
- This model works alongside SaaS subscription, not replacing it
- Attractive for employers who want usage-based costs: "only pay when you find good candidates"

**Stream 3 — Premium placements for job seekers (seeker pays)**
- "Boost my application" feature: seeker pays ₹99-299 to get their application highlighted in the employer's pipeline
- "Priority review" badge: guarantees employer sees the application within 24 hours
- Available as add-on credits, not a subscription feature
- Clearly labeled so employers know the candidate paid for visibility (transparency)

**Stream 4 — Recruitment-as-a-Service (enterprise)**
- For companies that want FitVector to manage their entire hiring pipeline
- Dedicated account manager + custom AI interview configuration + SLA on candidate quality
- Revenue: monthly retainer + per-hire success fee (5-10% of annual CTC)
- Target: enterprise clients hiring 20+ roles/quarter

**Stream 5 — Data and insights products (future)**
- Anonymized, aggregated hiring market reports sold to HR consultancies, VCs, and workforce planning teams
- Salary benchmarking API for other HR tools
- Skill demand trends by geography and industry

### 3.2 Revenue model principles
- SaaS subscriptions remain the core revenue — marketplace fees are additive
- Never charge job seekers for applying (basic apply is always free)
- "Boost" features for seekers are optional and clearly labeled — no pay-to-play gatekeeping
- Employer per-applicant fees are opt-in, never mandatory
- Transparency: both sides always know when money is involved in prioritization

---

## 4. Technical additions for Phase 3

### 4.1 Recommendation engine
- Collaborative filtering: "Candidates similar to you applied to and got hired at these companies"
- Content-based filtering: embedding similarity (existing from Phase 1, enhanced with marketplace data)
- Behavioral signals: application patterns, response rates, interview outcomes
- Model: lightweight ML model (scikit-learn or XGBoost initially) trained on FitVector's hiring outcome data
- Retrained weekly as new data accumulates
- Cold-start strategy: new users get content-based recommendations until behavioral data builds up

### 4.2 Real-time application status
- Supabase Realtime (WebSocket) for live status updates
- When employer moves a candidate in pipeline → seeker sees status change immediately
- Push notification (PWA) + email for stage changes
- Status states visible to seeker: Applied → Under Review → Interview Invited → Interview Completed → Decision Pending → Offer / Rejected

### 4.3 Payment infrastructure expansion
- Razorpay payment links for promoted listings and boost credits
- Employer invoicing for per-applicant fees (monthly consolidated invoice)
- Stripe Connect for future: if FitVector facilitates placement fees
- Credit system: seekers buy credit packs for boosts (₹499 for 5 boosts, ₹899 for 12)

### 4.4 Community infrastructure
- Forum engine: build on top of PostgreSQL (threads, posts, replies, votes)
- NOT a third-party forum embed — native to FitVector for consistent UX and data ownership
- Content moderation: Claude API for automated toxicity/spam detection + community flagging + manual review queue
- Reputation system: karma points for helpful posts, resume reviews, interview experience submissions
- Anti-gaming: rate limits on posts, minimum account age for certain actions, shadow-ban for repeat offenders

---

## 5. Database schema (additions for Phase 3)

### FitVector_Applications (marketplace applications — distinct from external tracking)
- id (UUID, PK)
- applicant_user_id (FK → Users)
- job_post_id (FK → Job_Posts)
- tailored_resume_id (FK → Tailored_Resumes)
- match_score (0-100, pre-computed)
- screening_responses (JSONB)
- interest_note (text, nullable)
- is_boosted (boolean)
- status (applied, under_review, interview_invited, interviewed, decision_pending, offered, rejected, withdrawn)
- status_updated_at
- employer_notes (text, nullable)
- created_at

### Promoted_Listings
- id (UUID, PK)
- job_post_id (FK → Job_Posts)
- company_id (FK → Companies)
- promotion_type (sponsored_feed, priority_placement)
- start_date, end_date
- amount_paid, currency
- payment_id (Razorpay/Stripe reference)
- impressions, clicks, applications (tracked metrics)
- status (active, expired, paused)
- created_at

### Application_Boosts
- id (UUID, PK)
- fitvector_application_id (FK → FitVector_Applications)
- user_id (FK → Users)
- amount_paid, currency
- payment_id
- created_at

### Community_Posts
- id (UUID, PK)
- user_id (FK → Users)
- post_type (interview_experience, resume_review, discussion, salary_report)
- title
- body (rich text)
- category (tech, business, design, marketing, general)
- company_id (FK → Companies, nullable — for interview experiences)
- role_title (nullable — for interview experiences)
- is_anonymous (boolean)
- upvotes, downvotes
- status (published, flagged, removed, under_review)
- ai_moderation_score (0-100, toxicity/spam probability)
- created_at, updated_at

### Community_Comments
- id (UUID, PK)
- post_id (FK → Community_Posts)
- user_id (FK → Users)
- parent_comment_id (FK → Community_Comments, nullable — for threading)
- body (text)
- upvotes
- status (published, flagged, removed)
- created_at

### User_Reputation
- id (UUID, PK)
- user_id (FK → Users)
- karma_points (integer)
- helpful_reviews_count
- interview_experiences_count
- community_posts_count
- badges (JSONB array — e.g., "top_reviewer", "verified_contributor")
- updated_at

### Verified_Profiles
- id (UUID, PK)
- user_id (FK → Users)
- identity_verified (boolean)
- education_verified (boolean)
- employment_verified (boolean)
- skills_verified (boolean)
- verification_documents (JSONB — encrypted references, not raw documents)
- verified_at
- expires_at (annual re-verification)

### Salary_Reports (anonymized)
- id (UUID, PK)
- user_id (FK → Users) — linked but never exposed publicly
- role_title, company_size_range, location
- experience_years
- base_salary, total_compensation
- currency
- verified (boolean — cross-referenced with employment verification)
- created_at

---

## 6. MVP scope — Phase 3 sub-phases

### Phase 3A — One-Click Apply (Week 1-6)
- "Apply via FitVector" button on employer-posted jobs
- Pre-apply modal with match score, resume selection, screening responses
- Application flows directly into employer pipeline (connected to Phase 2 pipeline)
- Real-time status updates for job seekers
- Application tracking on seeker side auto-synced
- Candidate quality signals (basic: selectivity, profile completeness)

### Phase 3B — Marketplace Revenue (Week 7-12)
- Promoted job listings (employer self-serve purchase)
- "Boost my application" for seekers (credit packs)
- Per-qualified-applicant billing (opt-in for employers)
- Smart matching and recommendations (enhanced with marketplace data)
- Employer response rate and transparency metrics
- FitVector Verified profiles (identity + education verification)

### Phase 3C — Community + Intelligence (Week 13-20)
- Interview experiences (anonymous, structured)
- Discussion forums (by domain)
- Salary insights and benchmarking
- Resume peer reviews
- Reputation and karma system
- Advanced analytics for both sides
- Employer branding pages
- Recruitment-as-a-Service (enterprise pilot)

---

## 7. Success metrics — Phase 3

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| One-click applications per month | 50,000 |
| Application → Interview conversion (FitVector apply vs external) | 3x higher |
| Promoted listings revenue | ₹5L/month |
| Per-applicant fee revenue | ₹3L/month |
| Boost credit purchases | ₹1L/month |
| Interview experiences submitted | 5,000 |
| Community MAU | 15,000 |
| Verified profiles | 10,000 |
| Employer satisfaction (FitVector apply vs other sources) | 80%+ prefer FitVector |
| Average time-to-hire for FitVector-applied candidates | 40% faster than external |
| Platform take rate (marketplace revenue / total hiring value facilitated) | 2-5% |

---

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chicken-and-egg: need employers for seekers, seekers for employers | Critical | Phase 1 builds seeker base first; Phase 2 employers get instant access to that base; Phase 3 connects them. Sequencing solves this. |
| "Boost" feature perceived as pay-to-play | High — trust erosion | Boosts only affect visibility priority, never screening scores. Always transparent. Limit boosts per candidate per role. |
| Community moderation at scale | Medium | AI moderation (Claude) handles 90% of cases. Community flagging + karma decay for bad actors. Manual review queue for edge cases. |
| Salary data inaccuracy | Medium — misleading users | Cross-reference with verified employment data. Flag unverified entries. Require minimum sample size before showing aggregated data. |
| Employer gaming (fake jobs for data) | Medium | Verification layer for employer accounts. Monitor posting patterns. Require at least 1 hire or active pipeline activity to maintain account. |
| Per-applicant fees create perverse incentives | Low | Only charge for applicants advanced past screening, not raw volume. Employer controls the threshold. |
| Feature bloat — too much at once | High — diluted focus | Strict sub-phasing (3A → 3B → 3C). Each sub-phase has clear launch criteria before next begins. |

---

## 9. Long-term vision (beyond Phase 3)

### Phase 4 possibilities (not scoped, for strategic planning):
- **FitVector API platform:** Let other HR tools integrate FitVector's AI screening and interviewer
- **Campus hiring module:** Universities partner with FitVector for placement season
- **Gig/contract marketplace:** Short-term project matching (design sprints, freelance dev, consulting)
- **Internal mobility:** Enterprise employees find internal role transfers via FitVector AI matching
- **Global expansion:** Localized platforms for US, UK, SEA, Middle East markets
- **AI career coach:** Long-term career path planning, skill development recommendations, mentorship matching
- **FitVector for recruiters/agencies:** White-labeled platform for staffing firms

---

## 10. Complete FitVector roadmap — All phases

| Phase | Focus | Key Deliverable | Revenue Model |
|-------|-------|-----------------|---------------|
| **1A** | Job seeker core | Job search + resume tailor + cold email + tracker | Free tier |
| **1B** | Seeker monetization | Payments, all features, PWA | SaaS subscriptions (seeker) |
| **1C** | Seeker growth | Chrome extension, analytics, referrals | Subscription upgrades |
| **2A** | Employer core | Job posting + AI resume screening + pipeline | SaaS subscriptions (employer) |
| **2B** | AI interviewer | Voice AI interviews + evaluation reports | Employer tier upsell |
| **2C** | Scheduling + collab | Calendar integration, team features, talent pool | Enterprise tier |
| **3A** | Marketplace core | One-click apply connecting both sides | — |
| **3B** | Marketplace revenue | Promoted listings, boosts, per-applicant fees | Marketplace fees |
| **3C** | Community | Interview experiences, forums, salary data, verification | Engagement + retention |

---

*This completes the FitVector product vision across all three phases. The platform evolves from a job seeker tool (Phase 1) to an employer hiring platform (Phase 2) to a full marketplace connecting both sides with community and intelligence layers (Phase 3).*
