// ─── Human Interview ───────────────────────────────────────────────────────

export type HumanInterviewType = 'phone_screen' | 'technical' | 'behavioral' | 'culture_fit' | 'hiring_manager' | 'panel';
export type HumanInterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
export type InterviewRating = 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';

export interface InterviewFeedback {
  rating: InterviewRating;
  strengths: string[];
  concerns: string[];
  notes: string;
  recommendation: string;
}

export interface HumanInterview {
  id: string;
  applicantId: string;
  jobPostId: string;
  interviewerId: string;
  roundNumber: number;
  interviewType: HumanInterviewType | null;
  scheduledAt: string | null;
  durationMinutes: number;
  meetingLink: string | null;
  calendarEventId: string | null;
  status: HumanInterviewStatus;
  feedback: InterviewFeedback | null;
  rating: InterviewRating | null;
  notes: string | null;
  rescheduledFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Candidate Notes & Votes ───────────────────────────────────────────────

export type CandidateVoteValue = 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';

export interface CandidateNote {
  id: string;
  applicantId: string;
  authorId: string;
  body: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidateVote {
  id: string;
  applicantId: string;
  voterId: string;
  vote: CandidateVoteValue;
  createdAt: string;
  updatedAt: string;
}
