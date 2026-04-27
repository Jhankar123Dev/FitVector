"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  IndianRupee,
  Briefcase,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCommunityPosts } from "@/hooks/use-community";

// Salary roles is a static filter list — not user-generated content, no API needed.
const SALARY_ROLES_COUNT = 15;

export default function CommunityPage() {
  const { data: interviewData } = useCommunityPosts("interview_experience");
  const { data: discussionData } = useCommunityPosts("discussion");

  const interviewCount = interviewData?.total ?? 0;
  const discussionCount = discussionData?.total ?? 0;

  const communitySections = [
    {
      title: "Interview Experiences",
      description: "Anonymous, structured interview reports from real candidates across top companies",
      href: "/dashboard/community/interviews",
      icon: Briefcase,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      stat: `${interviewCount} experiences shared`,
      statColor: "text-blue-600",
    },
    {
      title: "Discussions",
      description: "Engage with the community on tech, career advice, salary, and more",
      href: "/dashboard/community/discussions",
      icon: MessageSquare,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      stat: `${discussionCount} active threads`,
      statColor: "text-purple-600",
    },
    {
      title: "Salary Insights",
      description: "Anonymous salary data for 15+ roles across Bangalore, Mumbai, and Remote",
      href: "/dashboard/community/salaries",
      icon: IndianRupee,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      stat: `${SALARY_ROLES_COUNT}+ roles covered`,
      statColor: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Community</h1>
          <Badge variant="brand">Beta</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn from other job seekers, share your experiences, and discover salary insights
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Experiences", value: interviewCount.toString(), icon: Briefcase },
          { label: "Discussions", value: discussionCount.toString(), icon: MessageSquare },
          { label: "Roles Covered", value: `${SALARY_ROLES_COUNT}+`, icon: IndianRupee },
          { label: "Community Posts", value: (interviewCount + discussionCount).toLocaleString(), icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {communitySections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full cursor-pointer transition-all hover:border-brand-300 hover:shadow-card-hover">
              <CardContent className="flex flex-col p-5">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${section.iconBg}`}>
                  <section.icon className={`h-5 w-5 ${section.iconColor}`} />
                </div>
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{section.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs font-medium ${section.statColor}`}>{section.stat}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/70" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
