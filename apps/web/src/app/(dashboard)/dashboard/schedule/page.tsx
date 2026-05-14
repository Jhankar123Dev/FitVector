"use client";

import Link from "next/link";
import {
  Bot,
  Video,
  Clock,
  CalendarDays,
  Play,
  Timer,
  Layers,
  CalendarX,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyInterviews } from "@/hooks/use-seeker-interviews";
import type { SeekerInterview } from "@/app/api/seeker/interviews/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatScheduledAt(iso: string): string {
  const d        = new Date(iso);
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let prefix: string;
  if (d.toDateString() === today.toDateString()) {
    prefix = "Today";
  } else if (d.toDateString() === tomorrow.toDateString()) {
    prefix = "Tomorrow";
  } else {
    prefix = d.toLocaleDateString("en-US", {
      weekday: "short",
      month:   "short",
      day:     "numeric",
    });
  }
  const time = d.toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${prefix} · ${time}`;
}

function formatExpiry(iso: string): { label: string; urgent: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { label: "Expiring soon", urgent: true };

  const totalMins  = Math.floor(diff / 60_000);
  const totalHours = Math.floor(totalMins / 60);
  const days       = Math.floor(totalHours / 24);
  const hours      = totalHours % 24;

  if (days >= 1) {
    return {
      label:  `Expires in ${days}d${hours > 0 ? ` ${hours}h` : ""}`,
      urgent: false,
    };
  }
  if (totalHours >= 1) {
    return { label: `Expires in ${totalHours}h`, urgent: totalHours < 4 };
  }
  return { label: `Expires in ${totalMins}m`, urgent: true };
}

function interviewTypeLabel(type: string | null): string {
  if (!type) return "Interview";
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card className="border-l-4 border-l-border">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        </div>
        <div className="mt-3.5 border-t border-border pt-3.5">
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty section state ──────────────────────────────────────────────────────

function SectionEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 dark:bg-muted/10 py-7 px-4 text-center">
      <p className="text-sm text-muted-foreground/70">{message}</p>
    </div>
  );
}

// ─── AI Interview Card ────────────────────────────────────────────────────────

function AiInterviewCard({ interview }: { interview: SeekerInterview }) {
  const expiry    = interview.expiresAt ? formatExpiry(interview.expiresAt) : null;
  const isStarted = interview.status === "started";

  return (
    <Card className="border-l-4 border-l-brand-500 shadow-card transition-shadow duration-200 hover:shadow-card-hover motion-reduce:transition-none animate-fade-in">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: content */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-foreground truncate text-[15px] tracking-tight">
              {interview.jobTitle}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {interview.companyName}
            </p>

            {/* Badges / meta row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {interview.interviewType && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[11px] text-muted-foreground border-border"
                >
                  <Layers className="h-3 w-3" aria-hidden="true" />
                  {interviewTypeLabel(interview.interviewType)}
                </Badge>
              )}
              {isStarted && (
                <Badge className="gap-1 text-[11px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <Timer className="h-3 w-3" aria-hidden="true" />
                  In Progress
                </Badge>
              )}
              {expiry && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-medium tabular-nums ${
                    expiry.urgent
                      ? "text-red-500 dark:text-red-400"
                      : "text-muted-foreground/80"
                  }`}
                >
                  <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {expiry.label}
                </span>
              )}
            </div>
          </div>

          {/* Right: AI avatar */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950 ring-1 ring-brand-100 dark:ring-brand-900"
            aria-hidden="true"
          >
            <Bot className="h-[18px] w-[18px] text-brand-600 dark:text-brand-400" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3.5 border-t border-border pt-3.5">
          <Button
            size="sm"
            className="cursor-pointer gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            asChild
          >
            <Link href={interview.actionUrl}>
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              {isStarted ? "Resume Interview" : "Start Interview"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Human Interview Card ─────────────────────────────────────────────────────

function HumanInterviewCard({ interview }: { interview: SeekerInterview }) {
  const hasLink = Boolean(interview.meetingLink && interview.meetingLink !== "#");

  return (
    <Card className="border-l-4 border-l-accent-500 shadow-card transition-shadow duration-200 hover:shadow-card-hover motion-reduce:transition-none animate-fade-in">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: content */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-foreground truncate text-[15px] tracking-tight">
              {interview.jobTitle}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {interview.companyName}
            </p>

            {/* Date / time / duration */}
            {interview.scheduledAt && (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground/80">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {formatScheduledAt(interview.scheduledAt)}
                </span>
                {interview.durationMinutes && (
                  <span className="flex items-center gap-1">
                    <span className="text-border" aria-hidden="true">·</span>
                    <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {interview.durationMinutes} min
                  </span>
                )}
              </div>
            )}

            {/* Round + interview type badges */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {interview.roundNumber && (
                <Badge
                  variant="outline"
                  className="text-[11px] text-muted-foreground border-border"
                >
                  Round {interview.roundNumber}
                </Badge>
              )}
              {interview.interviewType && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[11px] text-muted-foreground border-border"
                >
                  <Video className="h-3 w-3" aria-hidden="true" />
                  {interviewTypeLabel(interview.interviewType)}
                </Badge>
              )}
            </div>
          </div>

          {/* Right: human avatar */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-900/30 ring-1 ring-accent-100 dark:ring-accent-900"
            aria-hidden="true"
          >
            <Video className="h-[18px] w-[18px] text-accent-600 dark:text-accent-400" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3.5 border-t border-border pt-3.5">
          {hasLink ? (
            <Button
              size="sm"
              className="cursor-pointer gap-2 bg-accent-600 hover:bg-accent-700 text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
              asChild
            >
              <a
                href={interview.meetingLink!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Join meeting for ${interview.jobTitle} at ${interview.companyName}`}
              >
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
                Join Meeting
              </a>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="gap-2 cursor-not-allowed text-muted-foreground"
            >
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              Link pending
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  count,
  countBg,
  countColor,
  isLoading,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  count: number;
  countBg: string;
  countColor: string;
  isLoading: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} aria-hidden="true" />
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
        {title}
      </h2>
      {!isLoading && count > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${countBg} ${countColor}`}
        >
          {count}
        </span>
      )}
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { data, isLoading, isError, error, refetch } = useMyInterviews();

  const interviews      = data?.data ?? [];
  const aiInterviews    = interviews.filter((i) => i.type === "ai");
  const humanInterviews = interviews.filter((i) => i.type === "human");
  const totalCount      = interviews.length;
  const bothEmpty       = !isLoading && !isError && totalCount === 0;

  return (
    <div className="space-y-8 pb-8">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Interviews
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            All your pending AI interviews and upcoming scheduled calls
          </p>
        </div>
        {!isLoading && totalCount > 0 && (
          <Badge
            variant="outline"
            className="mt-1 self-start sm:self-auto shrink-0 text-xs text-muted-foreground tabular-nums"
          >
            {totalCount} upcoming
          </Badge>
        )}
      </div>

      {/* ── Error state ───────────────────────────────────────────────── */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-5 px-5">
            <AlertCircle
              className="h-5 w-5 shrink-0 text-destructive mt-0.5 sm:mt-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Couldn&apos;t load interviews
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(error as Error)?.message || "Something went wrong. Please try again."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 cursor-pointer gap-1.5"
              onClick={() => refetch()}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Full empty state (zero interviews, no error) ───────────────── */}
      {bothEmpty && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center gap-5 py-20 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 dark:bg-muted/30 ring-1 ring-border">
              <CalendarX className="h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
            </div>
            <div className="max-w-xs">
              <p className="text-base font-semibold text-foreground/90">
                No upcoming interviews
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                When an employer invites you for an AI screening or schedules a
                call, it will appear here.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
              asChild
            >
              <Link href="/dashboard/applications">Browse Applications</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Section 1: Pending AI Interviews ──────────────────────────── */}
      {!bothEmpty && (
        <section aria-labelledby="ai-section-heading">
          <SectionHeader
            icon={Bot}
            iconBg="bg-brand-50 dark:bg-brand-950"
            iconColor="text-brand-600 dark:text-brand-400"
            title="Pending AI Interviews"
            count={aiInterviews.length}
            countBg="bg-brand-100 dark:bg-brand-900/60"
            countColor="text-brand-700 dark:text-brand-300"
            isLoading={isLoading}
          />

          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : aiInterviews.length === 0 ? (
            <SectionEmpty message="No pending AI interviews — you're all caught up!" />
          ) : (
            <div className="space-y-3">
              {aiInterviews.map((interview) => (
                <AiInterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Section 2: Upcoming Scheduled Interviews ──────────────────── */}
      {!bothEmpty && (
        <section aria-labelledby="human-section-heading">
          <SectionHeader
            icon={Video}
            iconBg="bg-accent-50 dark:bg-accent-900/30"
            iconColor="text-accent-600 dark:text-accent-400"
            title="Upcoming Scheduled Interviews"
            count={humanInterviews.length}
            countBg="bg-accent-100 dark:bg-accent-900/40"
            countColor="text-accent-700 dark:text-accent-300"
            isLoading={isLoading}
          />

          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
            </div>
          ) : humanInterviews.length === 0 ? (
            <SectionEmpty message="No scheduled interviews yet — check back after an employer books a call." />
          ) : (
            <div className="space-y-3">
              {humanInterviews.map((interview) => (
                <HumanInterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
