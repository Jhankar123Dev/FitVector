import type { ScheduledInterview, CandidateVote, TeamActivity } from "@/types/employer";

// ── Helper: get dates for current week (Mon-Fri) ──────────────────────
function getWeekDate(dayOffset: number, hour: number, minute: number = 0): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Go to Monday
  monday.setHours(hour, minute, 0, 0);
  monday.setDate(monday.getDate() + dayOffset);
  return monday.toISOString();
}

// ── Scheduled Interviews ──────────────────────────────────────────────

export const MOCK_SCHEDULED_INTERVIEWS: ScheduledInterview[] = [
  {
    id: "si-001",
    candidateId: "app-008",
    candidateName: "Pooja Deshmukh",
    candidateEmail: "pooja.d@email.com",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    interviewerIds: ["tm-003"],
    interviewerNames: ["Rahul Gupta"],
    type: "video",
    status: "scheduled",
    scheduledAt: getWeekDate(0, 9, 0), // Monday 9:00
    duration: 45,
    meetingLink: "https://meet.google.com/abc-defg-hij",
    location: null,
    interviewerNotes: "Focus on React performance optimization and system design. Review her AI interview results before the call.",
    createdBy: "tm-002",
    createdAt: "2026-03-20T10:00:00Z",
  },
  {
    id: "si-002",
    candidateId: "app-013",
    candidateName: "Rohan Kulkarni",
    candidateEmail: "rohan.k@email.com",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    interviewerIds: ["tm-001"],
    interviewerNames: ["Arjun Mehta"],
    type: "onsite",
    status: "scheduled",
    scheduledAt: getWeekDate(0, 14, 0), // Monday 14:00
    duration: 60,
    meetingLink: null,
    location: "TechStartup Inc, Floor 3, Conference Room B, Koramangala, Bangalore",
    interviewerNotes: "System design round. Bring whiteboard markers. Assess architecture thinking and communication skills.",
    createdBy: "tm-001",
    createdAt: "2026-03-19T16:00:00Z",
  },
  {
    id: "si-003",
    candidateId: "app-009",
    candidateName: "Arjun Reddy",
    candidateEmail: "arjun.r@email.com",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    interviewerIds: ["tm-003"],
    interviewerNames: ["Rahul Gupta"],
    type: "video",
    status: "scheduled",
    scheduledAt: getWeekDate(1, 10, 30), // Tuesday 10:30
    duration: 45,
    meetingLink: "https://meet.google.com/klm-nopq-rst",
    location: null,
    interviewerNotes: "Technical deep-dive on TypeScript and state management. He scored well on the AI interview — focus on practical problem-solving.",
    createdBy: "tm-002",
    createdAt: "2026-03-20T11:00:00Z",
  },
  {
    id: "si-004",
    candidateId: "app-010",
    candidateName: "Kavitha Sundaram",
    candidateEmail: "kavitha.s@email.com",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    interviewerIds: ["tm-002"],
    interviewerNames: ["Priya Sharma"],
    type: "phone",
    status: "scheduled",
    scheduledAt: getWeekDate(1, 15, 0), // Tuesday 15:00
    duration: 30,
    meetingLink: null,
    location: null,
    interviewerNotes: "Initial culture-fit screening. Discuss team values and work style preferences. Check notice period.",
    createdBy: "tm-002",
    createdAt: "2026-03-20T14:00:00Z",
  },
  {
    id: "si-005",
    candidateId: "app-006",
    candidateName: "Vikram Patel",
    candidateEmail: "vikram.p@email.com",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    interviewerIds: ["tm-001", "tm-003"],
    interviewerNames: ["Arjun Mehta", "Rahul Gupta"],
    type: "onsite",
    status: "scheduled",
    scheduledAt: getWeekDate(2, 11, 0), // Wednesday 11:00
    duration: 60,
    meetingLink: null,
    location: "TechStartup Inc, Floor 3, Conference Room A, Koramangala, Bangalore",
    interviewerNotes: "Panel interview — final round. Both interviewers present. Cover system design + culture fit. Note: AI interview flagged borderline cheating risk.",
    createdBy: "tm-001",
    createdAt: "2026-03-18T09:00:00Z",
  },
  {
    id: "si-006",
    candidateId: "app-011",
    candidateName: "Sneha Iyer",
    candidateEmail: "sneha.i@email.com",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    interviewerIds: ["tm-002"],
    interviewerNames: ["Priya Sharma"],
    type: "video",
    status: "scheduled",
    scheduledAt: getWeekDate(3, 9, 30), // Thursday 9:30
    duration: 45,
    meetingLink: "https://meet.google.com/uvw-xyza-bcd",
    location: null,
    interviewerNotes: "Behavioural interview. Focus on teamwork, conflict resolution, and ownership mindset.",
    createdBy: "tm-002",
    createdAt: "2026-03-21T08:00:00Z",
  },
  {
    id: "si-007",
    candidateId: "app-012",
    candidateName: "Aditya Verma",
    candidateEmail: "aditya.v@email.com",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    interviewerIds: ["tm-003"],
    interviewerNames: ["Rahul Gupta"],
    type: "video",
    status: "scheduled",
    scheduledAt: getWeekDate(3, 14, 0), // Thursday 14:00
    duration: 45,
    meetingLink: "https://meet.google.com/efg-hijk-lmn",
    location: null,
    interviewerNotes: "Technical screen — React hooks, performance, testing strategies. His AI interview expired so no prior data.",
    createdBy: "tm-002",
    createdAt: "2026-03-21T10:00:00Z",
  },
  {
    id: "si-008",
    candidateId: "app-005",
    candidateName: "Rahul Menon",
    candidateEmail: "rahul.m@email.com",
    jobPostId: "jp-002",
    jobTitle: "Backend Engineer",
    interviewerIds: ["tm-001"],
    interviewerNames: ["Arjun Mehta"],
    type: "phone",
    status: "scheduled",
    scheduledAt: getWeekDate(4, 10, 0), // Friday 10:00
    duration: 30,
    meetingLink: null,
    location: null,
    interviewerNotes: "Quick intro call to discuss the role and gauge interest. Candidate was referred internally.",
    createdBy: "tm-001",
    createdAt: "2026-03-22T12:00:00Z",
  },
];

// ── Candidate Votes ───────────────────────────────────────────────────

export const MOCK_CANDIDATE_VOTES: CandidateVote[] = [
  // Pooja Deshmukh — strong consensus (3 positive)
  {
    id: "vote-001",
    candidateId: "app-008",
    voterId: "tm-003",
    voterName: "Rahul Gupta",
    voterRole: "hiring_manager",
    vote: "strong_hire",
    comment: "Excellent system design thinking. Very strong on React internals.",
    createdAt: "2026-03-22T16:00:00Z",
  },
  {
    id: "vote-002",
    candidateId: "app-008",
    voterId: "tm-002",
    voterName: "Priya Sharma",
    voterRole: "recruiter",
    vote: "hire",
    comment: "Great communication skills and culture fit.",
    createdAt: "2026-03-22T17:00:00Z",
  },
  {
    id: "vote-003",
    candidateId: "app-008",
    voterId: "tm-001",
    voterName: "Arjun Mehta",
    voterRole: "admin",
    vote: "hire",
    comment: null,
    createdAt: "2026-03-23T09:00:00Z",
  },

  // Arjun Reddy — some disagreement
  {
    id: "vote-004",
    candidateId: "app-009",
    voterId: "tm-001",
    voterName: "Arjun Mehta",
    voterRole: "admin",
    vote: "strong_hire",
    comment: "Incredible problem-solving. Would be a great addition to the team.",
    createdAt: "2026-03-21T14:00:00Z",
  },
  {
    id: "vote-005",
    candidateId: "app-009",
    voterId: "tm-003",
    voterName: "Rahul Gupta",
    voterRole: "hiring_manager",
    vote: "hire",
    comment: "Solid technical skills. Slightly concerned about experience level.",
    createdAt: "2026-03-21T15:00:00Z",
  },
  {
    id: "vote-006",
    candidateId: "app-009",
    voterId: "tm-002",
    voterName: "Priya Sharma",
    voterRole: "recruiter",
    vote: "no_hire",
    comment: "Communication could be better. Struggled to articulate thoughts clearly during the screen.",
    createdAt: "2026-03-21T16:00:00Z",
  },

  // Kavitha Sundaram — split
  {
    id: "vote-007",
    candidateId: "app-010",
    voterId: "tm-002",
    voterName: "Priya Sharma",
    voterRole: "recruiter",
    vote: "hire",
    comment: "Enthusiastic and great culture alignment.",
    createdAt: "2026-03-22T10:00:00Z",
  },
  {
    id: "vote-008",
    candidateId: "app-010",
    voterId: "tm-003",
    voterName: "Rahul Gupta",
    voterRole: "hiring_manager",
    vote: "no_hire",
    comment: "Technical depth not sufficient for a senior role. Better fit for mid-level.",
    createdAt: "2026-03-22T11:00:00Z",
  },
];

// ── Team Activity Log ─────────────────────────────────────────────────

export const MOCK_TEAM_ACTIVITY: TeamActivity[] = [
  {
    id: "ta-001",
    actorName: "Arjun Mehta",
    actorRole: "admin",
    description: "Invited Sneha to join as Viewer",
    timestamp: "2026-03-10T11:00:00Z",
  },
  {
    id: "ta-002",
    actorName: "Arjun Mehta",
    actorRole: "admin",
    description: "Changed Priya Sharma's role from Viewer to Recruiter",
    timestamp: "2026-03-12T09:30:00Z",
  },
  {
    id: "ta-003",
    actorName: "Priya Sharma",
    actorRole: "recruiter",
    description: "Scheduled video interview with Pooja Deshmukh for Monday 9:00 AM",
    timestamp: "2026-03-20T10:00:00Z",
  },
  {
    id: "ta-004",
    actorName: "Arjun Mehta",
    actorRole: "admin",
    description: "Scheduled onsite interview with Rohan Kulkarni for Monday 2:00 PM",
    timestamp: "2026-03-19T16:00:00Z",
  },
  {
    id: "ta-005",
    actorName: "Priya Sharma",
    actorRole: "recruiter",
    description: "Added a note on Pooja Deshmukh: 'Very promising candidate, prioritise scheduling'",
    timestamp: "2026-03-20T14:30:00Z",
  },
  {
    id: "ta-006",
    actorName: "Rahul Gupta",
    actorRole: "hiring_manager",
    description: "Voted Strong Hire on Pooja Deshmukh",
    timestamp: "2026-03-22T16:00:00Z",
  },
  {
    id: "ta-007",
    actorName: "Priya Sharma",
    actorRole: "recruiter",
    description: "Moved Arjun Reddy to Human Interview stage",
    timestamp: "2026-03-21T10:00:00Z",
  },
  {
    id: "ta-008",
    actorName: "Arjun Mehta",
    actorRole: "admin",
    description: "Voted Strong Hire on Arjun Reddy",
    timestamp: "2026-03-21T14:00:00Z",
  },
  {
    id: "ta-009",
    actorName: "Priya Sharma",
    actorRole: "recruiter",
    description: "Scheduled phone screening with Kavitha Sundaram for Tuesday 3:00 PM",
    timestamp: "2026-03-20T14:00:00Z",
  },
  {
    id: "ta-010",
    actorName: "Rahul Gupta",
    actorRole: "hiring_manager",
    description: "Added interviewer notes for Vikram Patel's onsite round",
    timestamp: "2026-03-18T09:30:00Z",
  },
  {
    id: "ta-011",
    actorName: "Priya Sharma",
    actorRole: "recruiter",
    description: "Scheduled video interview with Sneha Iyer for Thursday 9:30 AM",
    timestamp: "2026-03-21T08:00:00Z",
  },
  {
    id: "ta-012",
    actorName: "Arjun Mehta",
    actorRole: "admin",
    description: "Scheduled phone call with Rahul Menon for Friday 10:00 AM",
    timestamp: "2026-03-22T12:00:00Z",
  },
];

// ── Calendar Integrations (placeholders) ──────────────────────────────

export const MOCK_CALENDAR_INTEGRATIONS = {
  google: false,
  outlook: false,
};
