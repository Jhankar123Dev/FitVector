"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  Video,
  TrendingUp,
  ArrowRight,
  Clock,
  Target,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { MOCK_COMPANY, MOCK_EMPLOYER_STATS } from "@/lib/mock/employer-data";

const STATS = [
  {
    label: "Active Jobs",
    value: MOCK_EMPLOYER_STATS.activeJobs,
    icon: Briefcase,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    href: "/employer/jobs",
  },
  {
    label: "Total Applicants",
    value: MOCK_EMPLOYER_STATS.totalApplicants,
    icon: Users,
    iconBg: "bg-accent-50",
    iconColor: "text-accent-600",
    href: "/employer/candidates",
  },
  {
    label: "Interviews This Week",
    value: MOCK_EMPLOYER_STATS.interviewsThisWeek,
    icon: Video,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/employer/interviews",
  },
  {
    label: "Offers Extended",
    value: MOCK_EMPLOYER_STATS.offersExtended,
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "/employer/candidates",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Post a New Job",
    description: "Create a job listing with AI-powered screening",
    icon: Briefcase,
    href: "/employer/jobs",
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
  },
  {
    label: "Review Candidates",
    description: "Screen and rank applicants across all roles",
    icon: Target,
    href: "/employer/candidates",
    iconBg: "bg-accent-50",
    iconColor: "text-accent-600",
  },
  {
    label: "View Analytics",
    description: "Track your hiring funnel and key metrics",
    icon: TrendingUp,
    href: "/employer/analytics",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export default function EmployerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-surface-800">
          Welcome back, {MOCK_COMPANY.name}
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Here&apos;s what&apos;s happening with your hiring pipeline
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-card-hover">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-lg p-2.5 ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-800">
                    {stat.value}
                  </p>
                  <p className="text-xs text-surface-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-4 rounded-lg border border-surface-200 p-4 transition-all hover:border-surface-300 hover:shadow-card"
                >
                  <div className={`rounded-lg p-2.5 ${action.iconBg}`}>
                    <action.icon
                      className={`h-5 w-5 ${action.iconColor}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-800">
                      {action.label}
                    </p>
                    <p className="text-xs text-surface-500">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-surface-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column: hiring metrics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hiring Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-surface-400" />
                  <span className="text-sm text-surface-600">
                    Avg. Time to Hire
                  </span>
                </div>
                <span className="text-sm font-semibold text-surface-800">
                  {MOCK_EMPLOYER_STATS.avgTimeToHire}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-surface-400" />
                  <span className="text-sm text-surface-600">
                    Screening Accuracy
                  </span>
                </div>
                <span className="text-sm font-semibold text-surface-800">
                  {MOCK_EMPLOYER_STATS.screeningAccuracy}
                </span>
              </div>

              {/* Mini funnel */}
              <div className="mt-2 space-y-2 border-t border-surface-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                  Hiring Funnel
                </p>
                {[
                  { label: "Applied", count: 127, pct: 100 },
                  { label: "AI Screened", count: 89, pct: 70 },
                  { label: "AI Interviewed", count: 34, pct: 27 },
                  { label: "Human Interview", count: 12, pct: 9 },
                  { label: "Offered", count: 2, pct: 2 },
                ].map((stage) => (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-600">{stage.label}</span>
                      <span className="font-medium text-surface-800">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-100">
                      <div
                        className="h-1.5 rounded-full bg-brand-500 transition-all"
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Company plan info */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-surface-700">
                  Plan
                </span>
                <Badge variant="brand" className="capitalize">
                  {MOCK_COMPANY.planTier}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-surface-500">
                10 active jobs, 500 screenings/mo, 50 AI interviews/mo
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/employer/settings">Manage Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
