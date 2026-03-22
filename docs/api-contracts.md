# FitVector — API Contracts

**Version:** 1.0
**Last Updated:** March 22, 2026
**Scope:** Phase 1 (Job Seeker) — all endpoints

---

## 1. API conventions

### Base URLs
- **Next.js API:** `https://fitvector.com/api` (public-facing)
- **Python microservice:** `http://ai-engine.internal:8000` (internal only, never exposed)

### Authentication
All `/api/*` routes (except `/api/auth/*` and `/api/health`) require authentication.
- Auth header: `Cookie: next-auth.session-token=<JWT>`
- API routes extract user from session via `getServerSession()`

### Response format
Every endpoint returns this shape:
```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, details?: unknown, upgrade?: boolean }
// upgrade=true means user hit a plan limit
```

### HTTP status codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (wrong plan tier) |
| 404 | Not found |
| 429 | Plan limit exceeded OR rate limited |
| 500 | Internal server error |

### Rate limiting
- General API: 100 requests/minute per user
- AI endpoints (`/api/ai/*`): 10 requests/minute per user
- Job search: 5 requests/minute per user
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 2. Auth endpoints

### POST /api/auth/[...nextauth]
Handled entirely by Auth.js. Supports:
- `GET /api/auth/signin` — Sign-in page
- `POST /api/auth/callback/google` — Google OAuth callback
- `POST /api/auth/callback/linkedin` — LinkedIn OAuth callback
- `POST /api/auth/callback/credentials` — Email/password login
- `GET /api/auth/session` — Get current session
- `POST /api/auth/signout` — Sign out

---

## 3. User and profile endpoints

### GET /api/user/profile
Get current user's profile.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Priya Sharma",
    "avatarUrl": "https://...",
    "planTier": "free",
    "planExpiry": null,
    "onboardingCompleted": true,
    "profile": {
      "currentRole": "Frontend Developer",
      "currentCompany": "Acme Corp",
      "experienceLevel": "3_7",
      "targetRoles": ["Senior Frontend Developer", "Full Stack Engineer"],
      "targetLocations": ["Bangalore", "Remote"],
      "preferredWorkMode": "hybrid",
      "expectedSalaryMin": 1500000,
      "expectedSalaryMax": 2500000,
      "salaryCurrency": "INR",
      "skills": ["React", "TypeScript", "Node.js", "PostgreSQL"],
      "resumeParsedAt": "2026-03-22T10:00:00Z"
    }
  }
}
```

### PUT /api/user/profile
Update profile fields.

**Request body:**
```json
{
  "name": "Priya Sharma",
  "currentRole": "Frontend Developer",
  "targetRoles": ["Senior Frontend Developer"],
  "targetLocations": ["Bangalore", "Remote"],
  "experienceLevel": "3_7",
  "expectedSalaryMin": 1500000,
  "expectedSalaryMax": 2500000,
  "skills": ["React", "TypeScript", "Node.js"]
}
```
All fields optional — partial updates supported.

**Response 200:**
```json
{ "data": { "updated": true }, "message": "Profile updated" }
```

### POST /api/user/onboarding
Save onboarding wizard data and mark onboarding complete.

**Request body:**
```json
{
  "currentStatus": "working",
  "currentRole": "Frontend Developer",
  "currentCompany": "Acme Corp",
  "experienceLevel": "3_7",
  "targetRoles": ["Senior Frontend Developer", "Full Stack Engineer"],
  "targetLocations": ["Bangalore", "Remote"],
  "preferredWorkMode": "hybrid",
  "preferredJobTypes": ["fulltime"],
  "preferredIndustries": ["tech", "fintech"],
  "expectedSalaryMin": 1500000,
  "expectedSalaryMax": 2500000
}
```

**Response 201:**
```json
{ "data": { "onboardingCompleted": true }, "message": "Onboarding complete" }
```

---

## 4. Resume endpoints

### POST /api/ai/parse-resume
Upload and parse a resume file.

**Request:** `multipart/form-data`
- `file`: PDF or DOCX file (max 5MB)

**Response 200:**
```json
{
  "data": {
    "parsed": {
      "name": "Priya Sharma",
      "email": "priya@example.com",
      "phone": "+91-9876543210",
      "location": "Bangalore, India",
      "summary": "Frontend developer with 4 years of experience...",
      "experience": [
        {
          "company": "Acme Corp",
          "role": "Frontend Developer",
          "startDate": "2022-06",
          "endDate": "present",
          "bullets": [
            "Built React dashboard serving 50K+ daily users",
            "Reduced page load time by 40% through code splitting"
          ],
          "technologies": ["React", "TypeScript", "Webpack"]
        }
      ],
      "education": [
        {
          "institution": "IIT Bombay",
          "degree": "B.Tech",
          "field": "Computer Science",
          "graduationYear": 2022
        }
      ],
      "skills": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
      "projects": [],
      "certifications": []
    },
    "rawResumeUrl": "https://storage.supabase.co/resumes-raw/uuid.pdf"
  }
}
```

**Errors:**
- 400: Invalid file type or too large
- 500: Parsing failed (Claude API error)

### POST /api/ai/tailor-resume
Generate a tailored resume for a specific job.

**Request body:**
```json
{
  "jobId": "uuid",
  "templateId": "modern"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "versionName": "Google_SDE2_Mar2026",
    "pdfUrl": "https://storage.supabase.co/resumes-tailored/uuid.pdf",
    "latexSource": "\\documentclass{article}...",
    "templateUsed": "modern",
    "generationTimeMs": 8500,
    "createdAt": "2026-03-22T10:05:00Z"
  }
}
```

**Errors:**
- 429: Monthly resume tailor limit reached (`upgrade: true`)
- 404: Job not found

### GET /api/resume/history
List all tailored resume versions for current user.

**Query params:** `?page=1&limit=20`

**Response 200:**
```json
{
  "data": {
    "resumes": [
      {
        "id": "uuid",
        "versionName": "Google_SDE2_Mar2026",
        "jobTitle": "Senior Developer",
        "companyName": "Google",
        "templateUsed": "modern",
        "pdfUrl": "https://...",
        "createdAt": "2026-03-22T10:05:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### GET /api/resume/:id
Get a specific tailored resume.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "versionName": "Google_SDE2_Mar2026",
    "jobTitle": "Senior Developer",
    "companyName": "Google",
    "templateUsed": "modern",
    "pdfUrl": "https://...",
    "latexSource": "\\documentclass{article}...",
    "createdAt": "2026-03-22T10:05:00Z"
  }
}
```

---

## 5. Job endpoints

### GET /api/jobs/search
Search for jobs across all sources.

**Query params:**
```
?role=frontend+developer
&location=bangalore
&workMode=remote           # onsite, remote, hybrid (optional)
&jobType=fulltime          # fulltime, parttime, internship, contract (optional)
&hoursOld=72               # jobs posted within last N hours (default 72)
&experienceLevel=3_7       # optional
&salaryMin=1000000         # optional
&salaryMax=3000000         # optional
&page=1
&limit=25
```

**Response 200:**
```json
{
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "title": "Senior Frontend Developer",
        "companyName": "Google",
        "companyLogoUrl": "https://...",
        "location": "Bangalore, India",
        "workMode": "hybrid",
        "jobType": "fulltime",
        "salaryMin": 2000000,
        "salaryMax": 3500000,
        "salaryCurrency": "INR",
        "postedAt": "2026-03-20T08:00:00Z",
        "sources": ["linkedin", "naukri"],
        "url": "https://linkedin.com/jobs/...",
        "matchScore": 87,
        "matchBucket": "strong_fit",
        "skillsRequired": ["React", "TypeScript", "System Design"],
        "isEasyApply": true,
        "isSaved": false
      }
    ],
    "total": 142,
    "page": 1,
    "limit": 25,
    "cached": true,
    "cachedAt": "2026-03-22T03:00:00Z"
  }
}
```

**Errors:**
- 429: Daily search limit reached

### GET /api/jobs/:id
Get full job details.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Senior Frontend Developer",
    "companyName": "Google",
    "companyLogoUrl": "https://...",
    "companyUrl": "https://google.com",
    "companySize": "10000+",
    "companyIndustry": "Technology",
    "companyRating": 4.3,
    "location": "Bangalore, India",
    "workMode": "hybrid",
    "jobType": "fulltime",
    "description": "## About the role\n\nWe're looking for...",
    "skillsRequired": ["React", "TypeScript", "System Design"],
    "skillsNiceToHave": ["GraphQL", "AWS"],
    "experienceMin": 3,
    "experienceMax": 7,
    "salaryMin": 2000000,
    "salaryMax": 3500000,
    "salaryCurrency": "INR",
    "postedAt": "2026-03-20T08:00:00Z",
    "sources": ["linkedin", "naukri"],
    "url": "https://linkedin.com/jobs/...",
    "applyUrl": "https://...",
    "matchScore": 87,
    "matchBucket": "strong_fit",
    "skillMatch": {
      "matching": ["React", "TypeScript"],
      "missing": ["System Design"],
      "extra": ["Node.js", "PostgreSQL"]
    },
    "hasGapAnalysis": false,
    "isSaved": false,
    "applicationStatus": null
  }
}
```

### GET /api/jobs/matches
Get pre-computed job matches for current user's saved preferences.

**Query params:** `?unseen=true&minScore=60&page=1&limit=25`

**Response 200:** Same shape as `/api/jobs/search` response, sorted by match score descending.

### POST /api/ai/match-score
Compute match score for a specific job (on-demand).

**Request body:**
```json
{ "jobId": "uuid" }
```

**Response 200:**
```json
{
  "data": {
    "matchScore": 87,
    "matchBucket": "strong_fit",
    "similarityRaw": 0.72
  }
}
```

### POST /api/ai/gap-analysis
Get detailed AI gap analysis (Pro+ plans).

**Request body:**
```json
{ "jobId": "uuid" }
```

**Response 200:**
```json
{
  "data": {
    "matchingSkills": [
      { "skill": "React", "evidence": "4 years at Acme Corp, built dashboard for 50K users" },
      { "skill": "TypeScript", "evidence": "Primary language for last 3 years" }
    ],
    "missingSkills": [
      { "skill": "System Design", "importance": "high" },
      { "skill": "GraphQL", "importance": "medium" }
    ],
    "experienceGaps": [
      "No experience at FAANG-tier companies",
      "Limited distributed systems exposure"
    ],
    "strengths": [
      "Strong frontend portfolio with measurable impact",
      "Relevant tech stack overlap (React + TS)",
      "Growth trajectory: junior to mid in 2 years"
    ],
    "recommendations": [
      "Complete a system design course (Grokking System Design recommended)",
      "Build a GraphQL project and add to portfolio",
      "Emphasize the 50K users metric prominently in resume"
    ]
  }
}
```

**Errors:**
- 403: Feature not available on current plan
- 429: Monthly gap analysis limit reached

---

## 6. Outreach endpoints

### POST /api/ai/cold-email
Generate a cold email for a job.

**Request body:**
```json
{
  "jobId": "uuid",
  "tone": "professional",
  "recruiterName": "John Doe",
  "recruiterEmail": "john@google.com"
}
```
`recruiterName` and `recruiterEmail` are optional.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "subject": "Experienced Frontend Developer — Interested in Senior Role",
    "subjectAlternatives": [
      "React Specialist with 4 Years Experience — Senior Developer Opening",
      "Application: Senior Frontend Developer at Google"
    ],
    "body": "Hi John,\n\nI came across the Senior Frontend Developer...",
    "personalizationPoints": [
      "Referenced Google's Angular-to-React migration",
      "Mentioned candidate's 50K user dashboard project"
    ],
    "recruiterName": "John Doe",
    "recruiterEmail": "john@google.com"
  }
}
```

### POST /api/ai/linkedin-msg
Generate a LinkedIn InMail message.

**Request body:**
```json
{
  "jobId": "uuid",
  "messageType": "inmail",
  "recruiterName": "John Doe"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "body": "Hi John, I noticed Google is hiring for a Senior Frontend Developer...",
    "characterCount": 287
  }
}
```

### POST /api/ai/referral-msg
Generate a referral request message.

**Request body:**
```json
{
  "jobId": "uuid",
  "connectionName": "Sarah Chen",
  "relationshipContext": "former colleague"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "body": "Hi Sarah! Hope you're doing well at Google. I saw there's a Senior Frontend Developer opening...",
    "characterCount": 342
  }
}
```

### POST /api/outreach/find-recruiter
Find recruiter email for a company/role (Pro+ plans).

**Request body:**
```json
{
  "companyName": "Google",
  "companyDomain": "google.com",
  "jobTitle": "Senior Frontend Developer"
}
```

**Response 200:**
```json
{
  "data": {
    "results": [
      {
        "name": "John Doe",
        "email": "john.doe@google.com",
        "title": "Technical Recruiter",
        "confidence": "verified",
        "source": "hunter"
      },
      {
        "name": "Jane Smith",
        "email": "jane.smith@google.com",
        "title": "Recruiting Lead, Engineering",
        "confidence": "likely",
        "source": "apollo"
      }
    ]
  }
}
```

**Errors:**
- 403: Not available on current plan
- 429: Monthly email find limit reached

---

## 7. Application tracker endpoints

### GET /api/tracker
List all applications.

**Query params:**
```
?status=applied,interview    # comma-separated filter (optional)
&search=google               # search company/job title (optional)
&sort=createdAt              # createdAt, appliedAt, companyName, matchScore
&order=desc
&archived=false              # default false
&page=1
&limit=50
```

**Response 200:**
```json
{
  "data": {
    "applications": [
      {
        "id": "uuid",
        "jobTitle": "Senior Frontend Developer",
        "companyName": "Google",
        "companyLogoUrl": "https://...",
        "location": "Bangalore",
        "status": "interview",
        "appliedAt": "2026-03-18T10:00:00Z",
        "appliedVia": "linkedin",
        "tailoredResumeId": "uuid",
        "contactName": "John Doe",
        "nextFollowupDate": "2026-03-25",
        "notes": "Had first phone screen, went well",
        "interviewRounds": [
          {
            "round": 1,
            "type": "phone_screen",
            "date": "2026-03-21T10:00:00Z",
            "outcome": "passed"
          }
        ],
        "positionOrder": 0,
        "createdAt": "2026-03-15T08:00:00Z"
      }
    ],
    "total": 23,
    "statusCounts": {
      "saved": 5,
      "applied": 12,
      "screening": 3,
      "interview": 2,
      "offer": 1,
      "rejected": 8,
      "withdrawn": 0
    }
  }
}
```

### POST /api/tracker
Create a new application entry.

**Request body:**
```json
{
  "jobId": "uuid",
  "jobTitle": "Senior Frontend Developer",
  "companyName": "Google",
  "companyLogoUrl": "https://...",
  "location": "Bangalore",
  "jobUrl": "https://...",
  "jobSource": "linkedin",
  "status": "applied",
  "appliedVia": "linkedin",
  "tailoredResumeId": "uuid",
  "contactName": "John Doe",
  "contactEmail": "john@google.com",
  "notes": "Applied with tailored resume v2"
}
```
Only `jobTitle` and `companyName` are required.

**Response 201:**
```json
{
  "data": { "id": "uuid", "status": "applied" },
  "message": "Application tracked"
}
```

### PUT /api/tracker/:id
Update an application.

**Request body (partial update):**
```json
{
  "status": "interview",
  "notes": "Scheduled technical round for March 28",
  "nextFollowupDate": "2026-03-28",
  "interviewRounds": [
    {
      "round": 1,
      "type": "phone_screen",
      "date": "2026-03-21T10:00:00Z",
      "interviewer": "John Doe",
      "notes": "Asked about React hooks and state management",
      "outcome": "passed"
    },
    {
      "round": 2,
      "type": "technical",
      "date": "2026-03-28T14:00:00Z"
    }
  ]
}
```

**Response 200:**
```json
{ "data": { "id": "uuid", "status": "interview" }, "message": "Application updated" }
```

### PUT /api/tracker/reorder
Update position ordering for Kanban drag-and-drop.

**Request body:**
```json
{
  "updates": [
    { "id": "uuid-1", "status": "interview", "positionOrder": 0 },
    { "id": "uuid-2", "status": "interview", "positionOrder": 1 },
    { "id": "uuid-3", "status": "applied", "positionOrder": 0 }
  ]
}
```

**Response 200:**
```json
{ "data": { "updated": 3 } }
```

### DELETE /api/tracker/:id
Delete (archive) an application.

**Response 200:**
```json
{ "data": { "archived": true } }
```

### GET /api/tracker/analytics
Get application analytics.

**Response 200:**
```json
{
  "data": {
    "totalApplications": 45,
    "thisWeek": 8,
    "thisMonth": 23,
    "responseRate": 0.22,
    "averageDaysToResponse": 5.3,
    "byStatus": {
      "saved": 5,
      "applied": 12,
      "screening": 3,
      "interview": 2,
      "offer": 1,
      "rejected": 8
    },
    "topCompanies": [
      { "company": "Google", "count": 3, "responses": 2 },
      { "company": "Microsoft", "count": 2, "responses": 1 }
    ],
    "resumePerformance": [
      { "resumeId": "uuid", "versionName": "Google_SDE2", "applications": 3, "callbacks": 2 },
      { "resumeId": "uuid", "versionName": "Generic_v1", "applications": 10, "callbacks": 1 }
    ],
    "weeklyTrend": [
      { "week": "2026-W11", "applied": 5, "responses": 1 },
      { "week": "2026-W12", "applied": 8, "responses": 3 }
    ]
  }
}
```

---

## 8. Usage endpoint

### GET /api/usage
Get current month's usage vs plan limits.

**Response 200:**
```json
{
  "data": {
    "plan": "free",
    "month": "2026-03",
    "usage": {
      "jobSearch": { "used": 2, "limit": 3, "period": "daily" },
      "resumeTailor": { "used": 1, "limit": 2, "period": "monthly" },
      "coldEmail": { "used": 0, "limit": 2, "period": "monthly" },
      "linkedinMsg": { "used": 0, "limit": 2, "period": "monthly" },
      "referralMsg": { "used": 0, "limit": 0, "period": "monthly" },
      "emailFind": { "used": 0, "limit": 0, "period": "monthly" },
      "gapAnalysis": { "used": 0, "limit": 0, "period": "monthly" },
      "activeApplications": { "used": 4, "limit": 10, "period": "total" }
    }
  }
}
```

---

## 9. Payment endpoints

### POST /api/payments/create-subscription
Create a new subscription checkout session.

**Request body:**
```json
{
  "planTier": "pro",
  "billingCycle": "monthly",
  "provider": "razorpay"
}
```
`provider` auto-detected from user location if not specified.

**Response 200:**
```json
{
  "data": {
    "checkoutUrl": "https://rzp.io/i/xxx",
    "subscriptionId": "sub_xxx",
    "provider": "razorpay"
  }
}
```

### POST /api/payments/webhook/razorpay
### POST /api/payments/webhook/stripe
Webhook handlers — called by payment providers, not by frontend.

---

## 10. Python microservice internal API

These endpoints are called by the Next.js API routes, never by the frontend directly.

### Authentication
All requests must include: `X-Internal-Key: <PYTHON_SERVICE_SECRET>`

### POST /scrape/jobs
**Request:**
```json
{
  "role": "frontend developer",
  "location": "Bangalore",
  "sites": ["indeed", "linkedin", "google", "naukri", "glassdoor"],
  "hoursOld": 72,
  "resultsWanted": 50,
  "country": "India",
  "jobType": "fulltime",
  "isRemote": false
}
```

**Response:**
```json
{
  "jobs": [
    {
      "externalId": "12345",
      "source": "indeed",
      "title": "Senior Frontend Developer",
      "companyName": "Google",
      "location": "Bangalore, Karnataka",
      "description": "## About the role...",
      "url": "https://indeed.com/...",
      "postedAt": "2026-03-20",
      "salaryMin": null,
      "salaryMax": null,
      "jobType": "fulltime",
      "isRemote": false
    }
  ],
  "totalFound": 47,
  "scrapeTimeMs": 4200,
  "sourceResults": {
    "indeed": 15,
    "linkedin": 8,
    "google": 12,
    "naukri": 10,
    "glassdoor": 2
  }
}
```

### POST /ai/tailor-resume
### POST /ai/parse-resume
### POST /ai/cold-email
### POST /ai/linkedin-message
### POST /ai/match-score
### POST /ai/gap-analysis
### POST /find/recruiter-email

(Request/response shapes match the public API contracts above — the Next.js layer proxies them with minimal transformation, primarily adding auth checks and usage tracking.)

### GET /health
**Response:** `{ "status": "ok", "version": "1.0.0", "uptime": 86400 }`

---

*This API contracts document is the definitive reference for all endpoint shapes. Frontend and backend developers should reference this document to ensure consistency. Update this document before implementing any new endpoint.*
