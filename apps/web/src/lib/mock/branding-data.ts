import type { CompanyBranding, PromotedListing } from "@/types/employer";

// ─── Company Branding ──────────────────────────────────────────────────────

export const MOCK_COMPANY_BRANDING: CompanyBranding = {
  bannerUrl: null,
  story:
    "TechStartup Inc was born from a simple frustration: hiring in India is broken. Resumes get lost in ATS black holes, candidates ghost after applying to 500 jobs, and recruiters spend hours manually screening profiles that AI can evaluate in seconds.\n\nFounded in 2024 by engineers from Google and Flipkart, we're building AI-powered developer tools that make hiring 10x faster and fairer. Our platform uses embedding-based matching, AI interviews, and structured evaluation to connect the right candidates with the right roles — no bias, no guesswork, no wasted time. We're backed by top-tier VCs and growing rapidly with offices in Bangalore and San Francisco.",
  teamPhotos: [
    { id: "tp-001", url: null, caption: "Arjun Mehta — CTO", initials: "AM" },
    { id: "tp-002", url: null, caption: "Priya Sharma — Head of Recruiting", initials: "PS" },
    { id: "tp-003", url: null, caption: "Rahul Gupta — Engineering Lead", initials: "RG" },
    { id: "tp-004", url: null, caption: "Sneha Iyer — Product Designer", initials: "SI" },
    { id: "tp-005", url: null, caption: "Deepak Verma — ML Engineer", initials: "DV" },
    { id: "tp-006", url: null, caption: "Nisha Reddy — Growth Manager", initials: "NR" },
  ],
  benefits: [
    "Remote-first",
    "Unlimited PTO",
    "Learning Budget ₹50K/yr",
    "Health Insurance",
    "Stock Options (ESOP)",
    "Gym Membership",
    "Mental Health Support",
    "Annual Team Retreat",
  ],
  cultureValues: [
    {
      title: "Innovation First",
      description: "We push boundaries with AI and new tech. If it can be automated, it should be.",
      icon: "lightbulb",
    },
    {
      title: "Radical Ownership",
      description: "Every team member owns their domain end-to-end. No handoffs, no excuses.",
      icon: "target",
    },
    {
      title: "Transparent by Default",
      description: "Salaries, roadmap, metrics — everything is visible to the entire team.",
      icon: "eye",
    },
    {
      title: "Growth Mindset",
      description: "We invest in learning. 20% time for side projects and skill development.",
      icon: "trending-up",
    },
  ],
  dayInTheLife: [
    {
      jobPostId: "jp-001",
      jobTitle: "Senior Frontend Developer",
      description:
        "Start your day with a 15-minute standup over coffee. Dive into building React components for our AI-powered dashboard — think real-time data visualizations, drag-and-drop pipeline builders, and smooth animations. Afternoon is for code reviews and pair programming with the team. Wrap up with a tech talk or open-source contribution. Every Friday is 'Ship It Friday' where we deploy something new to production.",
    },
    {
      jobPostId: "jp-002",
      jobTitle: "Backend Engineer (Python)",
      description:
        "Morning starts with reviewing overnight AI pipeline runs and checking model accuracy metrics. Then it's heads-down coding — building FastAPI endpoints, optimizing Spark jobs, or fine-tuning Claude prompts for resume parsing. Lunch with the ML team to discuss embedding strategies. Afternoons are for system design sessions and infrastructure improvements. We deploy 3-4 times a day with zero-downtime releases.",
    },
  ],
  profileViews: 1247,
  followers: 89,
  applicationRate: 34,
};

// ─── Promoted Listings ─────────────────────────────────────────────────────

export const MOCK_PROMOTED_LISTINGS: PromotedListing[] = [
  {
    id: "promo-001",
    jobPostId: "jp-001",
    jobTitle: "Senior Frontend Developer",
    promotionType: "sponsored_feed",
    duration: 14,
    startDate: "2026-03-15T00:00:00Z",
    endDate: "2026-03-29T00:00:00Z",
    amountPaid: 2499,
    currency: "INR",
    impressions: 3400,
    clicks: 89,
    applications: 12,
    status: "active",
  },
  {
    id: "promo-002",
    jobPostId: "jp-002",
    jobTitle: "Backend Engineer (Python)",
    promotionType: "priority_search",
    duration: 7,
    startDate: "2026-03-20T00:00:00Z",
    endDate: "2026-03-27T00:00:00Z",
    amountPaid: 999,
    currency: "INR",
    impressions: 1200,
    clicks: 34,
    applications: 5,
    status: "active",
  },
];

// ─── Seeker Boost Credits ──────────────────────────────────────────────────

export const MOCK_SEEKER_BOOST_CREDITS = 3;
