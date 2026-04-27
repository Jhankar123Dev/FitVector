import Link from "next/link";
import {
  Search,
  FileText,
  Mail,
  LayoutDashboard,
  ArrowRight,
  Check,
  Zap,
  Target,
  Send,
  Building2,
  Users,
  Brain,
  ClipboardCheck,
  Video,
  Kanban,
  Briefcase,
  UserCheck,
  Star,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";

// ── Data ─────────────────────────────────────────────────────────────────────

const seekerFeatures = [
  {
    icon: Search,
    title: "Smart Multi-Platform Job Search",
    description:
      "Search across LinkedIn, Indeed, Glassdoor, and Naukri simultaneously. AI match scores show you exactly which jobs fit your profile — before you apply.",
  },
  {
    icon: FileText,
    title: "One-Click Resume Tailoring",
    description:
      "AI rewrites your resume for each application, highlighting the skills that matter to that specific employer. Authentic, targeted, and ATS-optimised every time.",
  },
  {
    icon: Mail,
    title: "AI Outreach Generator",
    description:
      "Generate personalized cold emails, LinkedIn InMails, and referral requests. Auto-find recruiter contact info so you reach the right person every time.",
  },
  {
    icon: LayoutDashboard,
    title: "Application Tracker",
    description:
      "Kanban board that tracks every application from Applied to Offer. Set follow-up reminders, log notes, and never lose track of your pipeline.",
  },
];

const employerFeatures = [
  {
    icon: Brain,
    title: "AI FitScore™ Matching",
    description:
      "Vector AI ranks every candidate against your job description in milliseconds. See exactly who is the best fit — before opening a single resume.",
  },
  {
    icon: ClipboardCheck,
    title: "Smart Assessments",
    description:
      "Auto-generate role-specific coding challenges, MCQ tests, and async video interviews. Screen hundreds of candidates without a single manual review.",
  },
  {
    icon: Video,
    title: "Interview Intelligence",
    description:
      "Schedule AI-powered interviews, compare candidates side-by-side with scored transcripts, and make data-backed hiring decisions in minutes.",
  },
  {
    icon: Kanban,
    title: "Full Hiring Pipeline",
    description:
      "Drag-and-drop Kanban from Applied to Hired. Bulk actions, automated status updates, and team collaboration — all in one place.",
  },
];

const seekerSteps = [
  {
    step: "01",
    icon: Search,
    title: "Search Once, Find Everywhere",
    description:
      "Enter your role and target skills once. FitVector searches all major job boards and scores every result by your AI match percentage instantly.",
  },
  {
    step: "02",
    icon: Target,
    title: "AI Tailors Your Application",
    description:
      "One click. Your resume is rewritten for that specific job — skills matched, keywords optimised, ATS-friendly. Every single time.",
  },
  {
    step: "03",
    icon: Send,
    title: "Apply, Outreach & Track",
    description:
      "Apply directly, generate a personalised cold email or InMail, and watch your Kanban board update automatically as you progress.",
  },
];

const employerSteps = [
  {
    step: "01",
    icon: Briefcase,
    title: "Post a Job in 2 Minutes",
    description:
      "Describe the role. Our AI generates the full job description, sets screening criteria, and activates your candidate pipeline instantly.",
  },
  {
    step: "02",
    icon: Brain,
    title: "AI Ranks Every Applicant",
    description:
      "Every candidate is automatically scored with FitScore™ — vector similarity against your JD. Your top 10 surface immediately.",
  },
  {
    step: "03",
    icon: UserCheck,
    title: "Assess, Interview & Hire",
    description:
      "Run automated assessments and AI interviews, then move candidates through your pipeline. Hire the right person in days, not weeks.",
  },
];

const stats = [
  { value: "10,000+", label: "Active Job Seekers" },
  { value: "500+", label: "Companies Hiring" },
  { value: "95%", label: "AI Match Accuracy" },
  { value: "3×", label: "Faster Time-to-Hire" },
];

const testimonials = [
  {
    quote:
      "FitVector's AI FitScore completely changed how we hire. We used to spend six hours reviewing 200 resumes. Now the AI surfaces the top 10 in seconds — and they're genuinely strong fits. We cut our time-to-hire by 65%.",
    name: "Rahul Mehta",
    role: "Senior Engineering Manager",
    company: "Groww",
    initials: "RM",
    avatarBg: "bg-accent-100",
    avatarColor: "text-accent-700",
    type: "employer" as const,
  },
  {
    quote:
      "I applied to 40 jobs in one week and landed 3 interview calls. The resume tailoring is genuinely impressive — it reads the JD and rewrites your experience to match it precisely. Nothing I've tried before comes close.",
    name: "Priya Sharma",
    role: "Software Engineer",
    company: "Freshworks (prev.)",
    initials: "PS",
    avatarBg: "bg-brand-100",
    avatarColor: "text-brand-700",
    type: "seeker" as const,
  },
];

const seekerPlans = [
  {
    name: "Free",
    price: "0",
    period: "",
    description: "Get started with basic job search",
    features: [
      "3 job searches / day",
      "2 resume tailors / day",
      "2 cold emails / day",
      "10 active applications",
      "1 resume template",
    ],
    cta: "Get Started Free",
    highlighted: false,
    ctaHref: "/signup",
  },
  {
    name: "Starter",
    price: "499",
    period: "/month",
    description: "For active job seekers",
    features: [
      "10 job searches / day",
      "10 resume tailors / day",
      "15 cold emails / day",
      "50 active applications",
      "2 resume templates",
      "Job alerts",
      "Follow-up reminders",
    ],
    cta: "Start Free Trial",
    highlighted: false,
    ctaHref: "/signup",
  },
  {
    name: "Pro",
    price: "999",
    period: "/month",
    description: "Unlimited power for serious seekers",
    features: [
      "Unlimited job searches",
      "50 resume tailors / day",
      "50 cold emails / day",
      "Unlimited applications",
      "3 resume templates",
      "Recruiter email finder",
      "Gap analysis",
      "Chrome extension",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    ctaHref: "/signup",
  },
  {
    name: "Elite",
    price: "1,999",
    period: "/month",
    description: "Everything unlimited",
    features: [
      "Everything in Pro",
      "Unlimited AI features",
      "100 email lookups / day",
      "Custom resume templates",
      "Priority support",
      "Early access to features",
    ],
    cta: "Start Free Trial",
    highlighted: false,
    ctaHref: "/signup",
  },
];

const employerPlans = [
  {
    name: "Starter",
    price: "2,999",
    period: "/month",
    description: "Perfect for early-stage hiring",
    features: [
      "5 active job posts",
      "AI FitScore ranking",
      "Basic candidate pipeline",
      "Up to 50 applications / month",
      "Standard assessments",
      "Email support",
    ],
    cta: "Start Hiring Free",
    highlighted: false,
    ctaHref: "/signup/employer",
  },
  {
    name: "Growth",
    price: "7,999",
    period: "/month",
    description: "For scaling teams",
    features: [
      "25 active job posts",
      "Unlimited FitScore matches",
      "Full Kanban pipeline",
      "500 applications / month",
      "MCQ + Coding assessments",
      "AI interview analysis",
      "Candidate comparison",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    ctaHref: "/signup/employer",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organisations",
    features: [
      "Unlimited job posts",
      "Unlimited applications",
      "Custom assessment templates",
      "API access & webhooks",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom integrations",
      "Team collaboration",
    ],
    cta: "Contact Sales",
    highlighted: false,
    ctaHref: "/contact",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── 1. Navbar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center text-2xl font-bold">
            <span className="text-primary">Fit</span>
            <span className="text-foreground">Vector</span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/#for-seekers"
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              For Job Seekers
            </Link>
            <Link
              href="/#for-employers"
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              For Employers
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              Pricing
            </Link>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            {/* Employer CTA — green outline */}
            <Link
              href="/signup/employer"
              className="hidden items-center gap-1.5 rounded-md border border-accent-500 px-3.5 py-2 text-sm font-medium text-accent-700 transition-colors duration-200 hover:bg-accent-50 hover:text-accent-800 sm:inline-flex"
            >
              Post a Job
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">

        {/* ── 2. Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          {/* Subtle sky-blue radial glow */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_60%,rgba(3,105,161,0.07),transparent)]" />

          <div className="mx-auto max-w-7xl px-6 text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Zap className="h-3 w-3" />
              AI-Powered Dual-Sided Hiring Platform
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Where AI Connects the Right{" "}
              <span className="text-primary">Talent</span> to the Right{" "}
              <span className="text-accent-600">Opportunity</span>
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Whether you're searching for your next role or building your
              dream team — FitVector's AI does the heavy lifting for both
              sides.
            </p>

            {/* ── Audience split cards ── */}
            <div className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
              {/* Job Seeker card */}
              <div className="group relative overflow-hidden rounded-xl border border-brand-200 bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover cursor-pointer">
                {/* Blue left accent bar */}
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-primary" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  I&apos;m a Job Seeker
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search smarter. Apply faster. Land more offers.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Multi-platform AI job search",
                    "One-click resume tailoring",
                    "Personalised outreach generator",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/signup">
                    Start Your Job Search
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Employer card */}
              <div className="group relative overflow-hidden rounded-xl border border-accent-200 bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover cursor-pointer">
                {/* Green left accent bar */}
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-accent-500" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50">
                  <Building2 className="h-6 w-6 text-accent-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  I&apos;m an Employer
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Find, assess, and hire top talent with AI precision.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "AI FitScore™ candidate matching",
                    "Smart automated assessments",
                    "Full hiring pipeline management",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 shrink-0 text-accent-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full bg-accent-500 text-white hover:bg-accent-600"
                  asChild
                >
                  <Link href="/signup/employer">
                    Start Hiring Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Social proof line */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <strong className="text-foreground">10,000+</strong>&nbsp;Job Seekers
              </span>
              <span className="text-border select-none">|</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-accent-600" />
                <strong className="text-foreground">500+</strong>&nbsp;Companies Hiring
              </span>
              <span className="text-border select-none">|</span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <strong className="text-foreground">95%</strong>&nbsp;AI Match Accuracy
              </span>
              <span className="text-border select-none hidden sm:inline">|</span>
              <span className="hidden text-muted-foreground sm:inline">
                Free plan · No credit card required
              </span>
            </div>
          </div>
        </section>

        {/* ── 3. For Job Seekers ──────────────────────────────────────────── */}
        <section
          id="for-seekers"
          className="border-t border-border bg-surface-50/40 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                <Search className="h-3 w-3" />
                For Job Seekers
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Land your dream job with AI superpowers
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From your first search to a signed offer — FitVector handles
                every step of your job hunt.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
              {seekerFeatures.map((f) => (
                <Card
                  key={f.title}
                  className="transition-shadow duration-200 hover:shadow-card-hover"
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Your Job Search
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── 4. For Employers ────────────────────────────────────────────── */}
        <section
          id="for-employers"
          className="border-t border-border bg-card py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
                <Building2 className="h-3 w-3" />
                For Employers
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Hire smarter with AI-powered talent intelligence
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From job posting to signed offer — FitVector finds, screens,
                and ranks your best candidates automatically.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
              {employerFeatures.map((f) => (
                <Card
                  key={f.title}
                  className="transition-shadow duration-200 hover:shadow-card-hover"
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50">
                      <f.icon className="h-6 w-6 text-accent-600" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button
                size="lg"
                className="bg-accent-500 text-white hover:bg-accent-600"
                asChild
              >
                <Link href="/signup/employer">
                  Post Your First Job Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── 5. How It Works ─────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="border-t border-border bg-background py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How FitVector Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simple, fast steps for both sides of the hiring equation.
              </p>
            </div>

            <div className="mt-16 grid gap-12 lg:grid-cols-2">
              {/* Job Seekers column */}
              <div>
                <div className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  <Search className="h-3 w-3" />
                  Job Seekers
                </div>
                <div className="space-y-0">
                  {seekerSteps.map((step, i) => (
                    <div key={step.title} className="flex gap-4">
                      {/* Step indicator + connector */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-50">
                          <span className="text-xs font-bold text-primary">
                            {step.step}
                          </span>
                        </div>
                        {i < seekerSteps.length - 1 && (
                          <div className="mt-1 h-12 w-0.5 bg-brand-100" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-10 pt-1.5">
                        <h3 className="text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employers column */}
              <div>
                <div className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
                  <Building2 className="h-3 w-3" />
                  Employers
                </div>
                <div className="space-y-0">
                  {employerSteps.map((step, i) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent-200 bg-accent-50">
                          <span className="text-xs font-bold text-accent-700">
                            {step.step}
                          </span>
                        </div>
                        {i < employerSteps.length - 1 && (
                          <div className="mt-1 h-12 w-0.5 bg-accent-100" />
                        )}
                      </div>
                      <div className="pb-10 pt-1.5">
                        <h3 className="text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Trust Stats ──────────────────────────────────────────────── */}
        <section className="bg-brand-900 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-4xl font-bold text-white sm:text-5xl">
                    {s.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-200">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Testimonials ─────────────────────────────────────────────── */}
        <section className="border-t border-border bg-surface-50/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Trusted by teams and talent alike
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Real results from both sides of the platform.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
              {testimonials.map((t) => (
                <Card key={t.name} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col p-6">
                    {/* Stars */}
                    <div className="mb-4 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    {/* Quote */}
                    <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    {/* Attribution */}
                    <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${t.avatarBg} ${t.avatarColor}`}
                      >
                        {t.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t.role} · {t.company}
                        </p>
                      </div>
                      {/* Audience label */}
                      <div
                        className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                          t.type === "employer"
                            ? "border-accent-200 bg-accent-50 text-accent-700"
                            : "border-brand-200 bg-brand-50 text-brand-700"
                        }`}
                      >
                        {t.type === "employer" ? (
                          <Building2 className="h-3 w-3" />
                        ) : (
                          <Search className="h-3 w-3" />
                        )}
                        {t.type === "employer" ? "Employer" : "Job Seeker"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. Pricing ──────────────────────────────────────────────────── */}
        <section id="pricing" className="border-t border-border bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free on either side. Upgrade when you need more power.
              </p>
            </div>

            {/* ── Job Seeker Plans ── */}
            <div className="mt-14">
              {/* Section divider */}
              <div className="relative mb-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <div className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-background px-4 py-1 text-sm font-medium text-brand-700">
                    <Search className="h-3.5 w-3.5" />
                    Job Seeker Plans
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {seekerPlans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`relative flex flex-col ${
                      plan.highlighted
                        ? "border-primary shadow-card-hover ring-1 ring-primary"
                        : ""
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price === "0" ? "Free" : `₹${plan.price}`}
                        </span>
                        {plan.period && (
                          <span className="text-sm text-muted-foreground">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2.5">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button
                        className="w-full"
                        variant={plan.highlighted ? "default" : "outline"}
                        asChild
                      >
                        <Link href={plan.ctaHref}>{plan.cta}</Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* ── Employer Plans ── */}
            <div className="mt-16">
              {/* Section divider */}
              <div className="relative mb-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <div className="flex items-center gap-1.5 rounded-full border border-accent-200 bg-background px-4 py-1 text-sm font-medium text-accent-700">
                    <Building2 className="h-3.5 w-3.5" />
                    Employer Plans
                  </div>
                </div>
              </div>

              <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
                {employerPlans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`relative flex flex-col ${
                      plan.highlighted
                        ? "border-accent-500 shadow-card-hover ring-1 ring-accent-500"
                        : ""
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="rounded-full bg-accent-500 px-3 py-0.5 text-xs font-semibold text-white">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price === "Custom" ? "Custom" : `₹${plan.price}`}
                        </span>
                        {plan.period && (
                          <span className="text-sm text-muted-foreground">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2.5">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button
                        className={`w-full ${
                          plan.highlighted
                            ? "bg-accent-500 text-white hover:bg-accent-600"
                            : ""
                        }`}
                        variant={plan.highlighted ? "default" : "outline"}
                        asChild
                      >
                        <Link href={plan.ctaHref}>{plan.cta}</Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. Final Split CTA ──────────────────────────────────────────── */}
        <section className="border-t border-border bg-surface-50/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Seeker CTA */}
              <div className="flex flex-col items-center rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-background p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Land your dream job
                </h3>
                <p className="mt-2 max-w-xs text-muted-foreground">
                  Join 10,000+ job seekers who have accelerated their search
                  with AI.
                </p>
                <Button size="lg" className="mt-6 w-full sm:w-auto" asChild>
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Free plan · No credit card required
                </p>
              </div>

              {/* Employer CTA */}
              <div className="flex flex-col items-center rounded-2xl border border-accent-200 bg-gradient-to-br from-accent-50 to-background p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-100">
                  <Building2 className="h-7 w-7 text-accent-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Hire smarter, faster
                </h3>
                <p className="mt-2 max-w-xs text-muted-foreground">
                  500+ companies use FitVector to find qualified candidates 3×
                  faster with AI.
                </p>
                <Button
                  size="lg"
                  className="mt-6 w-full bg-accent-500 text-white hover:bg-accent-600 sm:w-auto"
                  asChild
                >
                  <Link href="/signup/employer">
                    Post a Job Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Free job post · Cancel any time
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
