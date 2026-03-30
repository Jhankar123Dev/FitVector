import Link from "next/link";
import { Search, FileText, Mail, LayoutDashboard, ArrowRight, Check, Zap, Target, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/layout/footer";

const features = [
  {
    icon: Search,
    title: "Smart Job Search",
    description:
      "Search across LinkedIn, Indeed, Glassdoor, and Naukri simultaneously. AI-powered matching scores tell you which jobs fit you best.",
  },
  {
    icon: FileText,
    title: "Resume Tailoring",
    description:
      "One click to tailor your resume for any job. AI rewrites your experience to match job requirements while keeping it authentic.",
  },
  {
    icon: Mail,
    title: "Cold Email & Outreach",
    description:
      "Generate personalized cold emails, LinkedIn InMails, and referral messages. Find recruiter emails automatically.",
  },
  {
    icon: LayoutDashboard,
    title: "Application Tracker",
    description:
      "Kanban board to track every application from Applied to Offer. Never lose track of where you stand.",
  },
];

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Search",
    description: "Search jobs across multiple platforms with a single query. Get AI match scores instantly.",
  },
  {
    icon: Target,
    step: "2",
    title: "Tailor",
    description: "AI tailors your resume for each job, highlighting relevant experience and skills.",
  },
  {
    icon: Send,
    step: "3",
    title: "Apply",
    description: "Generate outreach messages, track applications, and follow up automatically.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "Get started with basic job search",
    features: [
      "3 job searches/day",
      "2 resume tailors/day",
      "2 cold emails/day",
      "10 active applications",
      "1 resume template",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "499",
    period: "/month",
    description: "For active job seekers",
    features: [
      "10 job searches/day",
      "10 resume tailors/day",
      "15 cold emails/day",
      "50 active applications",
      "2 resume templates",
      "Job alerts",
      "Follow-up reminders",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "999",
    period: "/month",
    description: "Unlimited power for serious seekers",
    features: [
      "Unlimited job searches",
      "50 resume tailors/day",
      "50 cold emails/day",
      "Unlimited applications",
      "3 resume templates",
      "Recruiter email finder",
      "Gap analysis",
      "Chrome extension",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "1,999",
    period: "/month",
    description: "Everything unlimited",
    features: [
      "Everything in Pro",
      "Unlimited AI features",
      "100 email lookups/day",
      "Custom resume templates",
      "Priority support",
      "Early access to features",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center text-2xl font-bold">
            <span className="text-brand-500">Fit</span>
            <span className="text-surface-800">Vector</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/#features" className="text-sm text-surface-500 hover:text-surface-800 transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-surface-500 hover:text-surface-800 transition-colors">
              How it Works
            </Link>
            <Link href="/#pricing" className="text-sm text-surface-500 hover:text-surface-800 transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(108,92,231,0.08),transparent)]" />
          <div className="mx-auto max-w-7xl px-6 text-center">
            <Badge variant="brand" className="mb-6">
              <Zap className="mr-1 h-3 w-3" />
              AI-Powered Job Search Platform
            </Badge>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-surface-900 sm:text-6xl lg:text-7xl">
              Find Your Perfect Job with{" "}
              <span className="text-gradient-brand">
                AI Precision
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-surface-500 sm:text-xl">
              Search across multiple job boards, tailor your resume for each application, and
              generate personalized outreach — all powered by AI.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  I&apos;m Looking for a Job
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup/employer">I&apos;m Hiring</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-surface-400">No credit card required. Free plan available.</p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-surface-200 bg-surface-100/50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-surface-800 sm:text-4xl">
                Everything you need to land your dream job
              </h2>
              <p className="mt-4 text-lg text-surface-500">
                From search to offer, FitVector streamlines your entire job hunt.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.title} className="transition-shadow hover:shadow-card-hover">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                      <feature.icon className="h-6 w-6 text-brand-500" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-surface-800 sm:text-4xl">
                Three steps to your next job
              </h2>
              <p className="mt-4 text-lg text-surface-500">
                Simple, fast, and effective. Let AI do the heavy lifting.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="relative text-center">
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-surface-200 md:block" />
                  )}
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-50">
                    <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                      {step.step}
                    </span>
                    <step.icon className="h-10 w-10 text-brand-500" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-surface-800">{step.title}</h3>
                  <p className="mt-3 text-surface-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="border-t border-surface-200 bg-surface-100/50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-surface-800 sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-surface-500">
                Start free. Upgrade when you need more power.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pricingPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${plan.highlighted ? "border-brand-500 shadow-card-hover ring-1 ring-brand-500" : ""}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="brand">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-surface-800">
                        {plan.price === "0" ? "Free" : `\u20B9${plan.price}`}
                      </span>
                      {plan.price !== "0" && (
                        <span className="text-sm text-surface-500">{plan.period}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-surface-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                          {feature}
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
                      <Link href="/signup">{plan.cta}</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-800 sm:text-4xl">
              Ready to supercharge your job search?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-surface-500">
              Join thousands of job seekers who have landed their dream jobs with FitVector.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
