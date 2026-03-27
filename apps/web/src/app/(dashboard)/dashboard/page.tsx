"use client";

import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, FileText, Mail, Kanban } from "lucide-react";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    title: "Search Jobs",
    description: "Find matching jobs across multiple platforms",
    icon: Search,
    href: "/dashboard/jobs",
    color: "bg-brand-50 text-brand-500",
  },
  {
    title: "Tailor Resume",
    description: "AI-optimize your resume for a specific job",
    icon: FileText,
    href: "/dashboard/resume",
    color: "bg-accent-50 text-accent-600",
  },
  {
    title: "Generate Outreach",
    description: "Create cold emails and LinkedIn messages",
    icon: Mail,
    href: "/dashboard/outreach",
    color: "bg-brand-50 text-brand-600",
  },
  {
    title: "Track Applications",
    description: "Manage your application pipeline",
    icon: Kanban,
    href: "/dashboard/tracker",
    color: "bg-amber-50 text-amber-600",
  },
];

export default function DashboardPage() {
  const { user } = useUser();

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold text-surface-800 sm:text-3xl">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1 text-surface-500">
          Here&apos;s what&apos;s happening with your job search.
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-surface-800">Quick Actions</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Card key={action.title} className="transition-shadow hover:shadow-card-hover">
              <CardHeader className="pb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color.split(" ")[0]}`}>
                  <action.icon className={`h-5 w-5 ${action.color.split(" ")[1]}`} />
                </div>
                <CardTitle className="mt-3 text-base">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">{action.description}</CardDescription>
                <Button variant="outline" size="sm" asChild>
                  <Link href={action.href}>Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Placeholder stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Applications", value: "0" },
          { label: "Job Matches", value: "0" },
          { label: "Resumes Created", value: "0" },
          { label: "Messages Sent", value: "0" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <p className="text-sm text-surface-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-surface-800">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
