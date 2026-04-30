/**
 * support/mocks/ai-responses.ts
 *
 * Canonical mock responses for every AI/Python-service-backed endpoint.
 *
 * Every shape here mirrors the contract documented in the corresponding
 * `app/api/.../route.ts`. When a route's contract changes, update the
 * mock here — never inline mocks in specs (drift is the #1 cause of
 * flaky tests in this kind of suite).
 *
 * All mocks are `as const` so TypeScript surfaces breakage at the
 * spec callsite if the API contract evolves.
 */

// ─── Resume parsing — POST /api/ai/parse-resume ───────────────────────────────

export const MOCK_PARSE_RESUME_RESPONSE = {
  data: {
    parsed: {
      summary:
        "Experienced software developer with 5 years of experience building scalable web apps.",
      experience: [
        {
          company: "Acme Corp",
          role: "Software Engineer",
          start_date: "2019-06",
          end_date: "Present",
          bullets: [
            "Built and maintained REST APIs serving 50k+ daily requests",
            "Led a cross-functional team of 5 engineers",
          ],
          technologies: ["Node.js", "React", "TypeScript", "PostgreSQL"],
        },
      ],
      education: [
        {
          institution: "State University",
          degree: "Bachelor of Science",
          field: "Computer Science",
          year: 2019,
        },
      ],
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL"],
      projects: [],
      certifications: [],
    },
    rawResumeUrl: null,
  },
} as const;

// ─── Resume tailoring — POST /api/ai/tailor-resume ────────────────────────────

export const MOCK_TAILOR_RESUME_RESPONSE = {
  data: {
    tailoredResume: {
      summary:
        "Backend-leaning software engineer with hands-on experience scaling Node.js APIs to 50k+ daily requests.",
      experience: [
        {
          company: "Acme Corp",
          role: "Software Engineer",
          start_date: "2019-06",
          end_date: "Present",
          bullets: [
            "Architected REST APIs handling 50k+ daily requests with sub-100ms p95 latency",
            "Led a team of 5 engineers delivering a payment-processing service",
          ],
          technologies: ["Node.js", "TypeScript", "PostgreSQL", "Redis"],
        },
      ],
      skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS"],
    },
    latexSource: "% LaTeX source omitted in mock",
    pdfUrl: null,
    matchScore: 86,
    aiModel: "gemini-2.0-flash",
  },
} as const;

// ─── Cold email — POST /api/ai/cold-email ─────────────────────────────────────

export const MOCK_COLD_EMAIL_RESPONSE = {
  data: {
    subject: "Software Engineer — interested in joining Acme",
    subjectAlternatives: [
      "Reaching out about the Software Engineer role at Acme",
      "Quick intro re: Software Engineer position",
    ],
    body:
      "Hi {{recruiterName}},\n\n" +
      "I came across the Software Engineer opening at Acme and wanted to reach out. " +
      "My five years building scalable Node.js APIs map closely to what you're looking for, " +
      "and I'd love to learn more about the team.\n\n" +
      "Best,\n{{userName}}",
    tone: "professional",
    personalizationPoints: [
      "Mentioned matching tech stack (Node.js)",
      "Referenced years of experience",
    ],
    aiModel: "gemini-2.0-flash",
  },
} as const;

// ─── LinkedIn message — POST /api/ai/linkedin-msg ─────────────────────────────

export const MOCK_LINKEDIN_MSG_RESPONSE = {
  data: {
    body:
      "Hi {{recruiterName}}, I noticed Acme is hiring a Software Engineer. " +
      "I have five years of Node.js + TypeScript experience and would love to chat about the role. " +
      "Open to a quick call this week?",
    tone: "conversational",
    personalizationPoints: [
      "Direct outreach with role-specific opening",
      "Concrete next-step CTA",
    ],
    aiModel: "gemini-2.0-flash",
  },
} as const;

// ─── Referral request — POST /api/ai/referral-msg ─────────────────────────────

export const MOCK_REFERRAL_MSG_RESPONSE = {
  data: {
    body:
      "Hey {{recruiterName}}, hope you're doing well. " +
      "I saw Acme is hiring for a Software Engineer role and your team would be a great fit for my background. " +
      "Would you be open to a quick referral chat?",
    tone: "professional",
    personalizationPoints: [
      "Warm opener acknowledging existing connection",
      "Clear ask",
    ],
    aiModel: "gemini-2.0-flash",
  },
} as const;

// ─── Job description — POST /api/ai/job-description ───────────────────────────

export const MOCK_JOB_DESCRIPTION_RESPONSE = {
  data: {
    title: "Senior Software Engineer",
    description:
      "We're hiring a Senior Software Engineer to lead backend architecture for our growing platform. " +
      "You'll own the design and rollout of our payments service, mentor a team of three, and partner with product leadership.",
    requiredSkills: ["Node.js", "TypeScript", "PostgreSQL", "AWS"],
    niceToHaveSkills: ["Kubernetes", "GraphQL"],
    responsibilities: [
      "Design and ship new backend services",
      "Mentor mid-level engineers",
      "Own service-level reliability and performance",
    ],
    aiModel: "gemini-2.0-flash",
  },
} as const;

// ─── Gap analysis — POST /api/jobs/gap-analysis ───────────────────────────────

export const MOCK_GAP_ANALYSIS_RESPONSE = {
  data: {
    matchScore: 72,
    matchBucket: "good_fit",
    matchedSkills: ["TypeScript", "Node.js", "PostgreSQL"],
    missingSkills: ["Kubernetes", "GraphQL"],
    skillGaps: [
      {
        skill: "Kubernetes",
        importance: "high",
        suggestedResources: ["Kubernetes Up & Running (book)"],
      },
    ],
    recommendations: [
      "Highlight your PostgreSQL scaling work prominently in your summary.",
      "Take a Kubernetes fundamentals course to close the highest-impact gap.",
    ],
    decisionLabel: "prepare_then_apply",
  },
} as const;

// ─── Candidate AI screening — POST /api/employer/applicants/[id]/screen ───────

export const MOCK_SCREEN_CANDIDATE_RESPONSE = {
  data: {
    screeningScore: 84,
    bucket: "strong_fit",
    breakdown: {
      skillsMatch: 88,
      experienceMatch: 80,
      educationMatch: 90,
      cultureMatch: 75,
    },
    summary:
      "Candidate has strong skill alignment (Node.js, TypeScript) and 5+ years of relevant experience. Recommended advance.",
    strengths: ["Direct backend experience", "Team leadership"],
    concerns: ["Missing Kubernetes exposure"],
    aiRecommendation: "advance",
  },
} as const;

// ─── Generate assessment questions — POST /api/employer/assessments/generate-questions ───

export const MOCK_GENERATE_QUESTIONS_RESPONSE = {
  data: {
    questions: [
      {
        id: "q1",
        type: "mcq",
        prompt: "Which of the following is true about JavaScript closures?",
        options: [
          "They retain access to variables in their lexical scope",
          "They are garbage-collected immediately",
          "They cannot reference outer functions",
          "They are unique to async functions",
        ],
        correctAnswer: 0,
        difficulty: "medium",
      },
      {
        id: "q2",
        type: "short_answer",
        prompt: "Explain the difference between SQL JOIN and UNION.",
        difficulty: "medium",
      },
      {
        id: "q3",
        type: "coding",
        prompt: "Write a function that reverses a singly linked list.",
        starterCode:
          "function reverseList(head) {\n  // your code here\n}",
        testCases: [
          { input: "[1,2,3]", expectedOutput: "[3,2,1]" },
          { input: "[]", expectedOutput: "[]" },
        ],
        difficulty: "medium",
      },
    ],
  },
} as const;

// ─── AI interview next question — POST /api/interview/[token]/message ─────────

export const MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE = {
  nextQuestion:
    "Tell me about a time you had to debug a production incident under pressure. Walk me through the steps you took.",
  isComplete: false,
  turnNumber: 2,
} as const;

export const MOCK_INTERVIEW_COMPLETE_RESPONSE = {
  nextQuestion: null,
  isComplete: true,
  turnNumber: 7,
} as const;

// ─── Assessment grading — POST /api/assessment/[token]/submit ─────────────────

export const MOCK_GRADE_ASSESSMENT_RESPONSE = {
  data: {
    id: "00000000-0000-0000-0000-000000000000",
    status: "graded",
    autoScore: 82,
    finalScore: 82,
    timeTaken: 45,
    wasLate: false,
    needsManualReview: false,
    gradedAnswers: [
      { questionId: "q1", correct: true, score: 100 },
      { questionId: "q2", correct: true, score: 75 },
      { questionId: "q3", correct: true, score: 90 },
    ],
  },
} as const;

// ─── Onboarding completion — POST /api/user/onboarding ────────────────────────

export const MOCK_ONBOARDING_COMPLETE_RESPONSE = {
  data: { onboardingCompleted: true },
  message: "Onboarding complete",
} as const;

// ─── Minimal valid PDF (for resume upload tests) ──────────────────────────────
// Just enough bytes to satisfy client-side MIME/size validators.

export const MINIMAL_PDF_BUFFER = Buffer.from(
  "%PDF-1.4\n" +
    "1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n" +
    "2 0 obj\n<</Type /Pages /Kids [] /Count 0>>\nendobj\n" +
    "xref\n0 3\n" +
    "0000000000 65535 f \n" +
    "0000000009 00000 n \n" +
    "0000000058 00000 n \n" +
    "trailer\n<</Size 3 /Root 1 0 R>>\n" +
    "startxref\n114\n%%EOF\n",
);
