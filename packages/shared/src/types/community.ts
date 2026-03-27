// ─── Community Posts ───────────────────────────────────────────────────────

export type CommunityPostType = 'interview_experience' | 'discussion' | 'salary_report';
export type CommunityCategory = 'tech' | 'business' | 'design' | 'marketing' | 'career_advice' | 'salary' | 'general';
export type CommunityPostStatus = 'published' | 'flagged' | 'removed' | 'under_review';
export type CommentStatus = 'published' | 'flagged' | 'removed';
export type VoteType = 'up' | 'down';

export type InterviewDifficulty = 'easy' | 'medium' | 'hard';
export type InterviewOutcome = 'got_offer' | 'rejected' | 'ghosted' | 'in_progress';

export interface InterviewRound {
  roundNumber: number;
  type: string;
  questions: string[];
}

export interface InterviewData {
  companyName: string;
  role: string;
  difficulty: InterviewDifficulty;
  outcome: InterviewOutcome;
  rounds: InterviewRound[];
  processDescription: string;
  tips: string;
  overallRating: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  postType: CommunityPostType;
  title: string;
  body: string;
  category: CommunityCategory | null;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  status: CommunityPostStatus;
  interviewData: InterviewData | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  parentCommentId: string | null;
  body: string;
  isAnonymous: boolean;
  upvotes: number;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityVote {
  id: string;
  userId: string;
  targetType: 'post' | 'comment';
  targetId: string;
  voteType: VoteType;
  createdAt: string;
}

// ─── User Reputation ───────────────────────────────────────────────────────

export interface UserReputation {
  id: string;
  userId: string;
  karmaPoints: number;
  helpfulReviewsCount: number;
  interviewExperiencesCount: number;
  communityPostsCount: number;
  badges: string[];
  updatedAt: string;
}

// ─── Salary Report ─────────────────────────────────────────────────────────

export interface SalaryReport {
  id: string;
  userId: string;
  roleTitle: string;
  companyName: string | null;
  companySize: string | null;
  location: string;
  experienceYears: number;
  baseSalary: number;
  totalCompensation: number | null;
  currency: string;
  isVerified: boolean;
  createdAt: string;
}

export interface SalaryAggregation {
  sampleSize: number;
  medianSalary: number;
  p25Salary: number;
  p75Salary: number;
  minSalary: number;
  maxSalary: number;
}
