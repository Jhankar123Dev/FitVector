"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchScoreBadge } from "./match-score-badge";
import { DecisionBadge } from "./decision-badge";
import { SourceBadge } from "./source-badge";
import { MapPin, Clock, Briefcase, IndianRupee, Zap } from "lucide-react";
import type { JobSearchResult } from "@/types/job";

interface JobCardProps {
  job: JobSearchResult;
  onClick: (job: JobSearchResult) => void;
  isSelected?: boolean;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  } catch {
    return "";
  }
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export function JobCard({ job, onClick, isSelected }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const timeAgo = formatTimeAgo(job.postedAt);
  const isFitVector = job.sources.includes("fitvector");
  const isDirect = job.isDirect;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-card-hover ${
        isDirect ? "border-l-2 border-l-brand-500 " : isFitVector ? "border-l-2 border-l-accent-500 " : ""
      }${
        isSelected
          ? "border-brand-500 ring-1 ring-brand-500"
          : "hover:border-surface-300"
      }`}
      onClick={() => onClick(job)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold leading-tight text-surface-800">
                {job.title}
              </h3>
              {isDirect && (
                <Badge className="shrink-0 bg-brand-50 px-1.5 py-0 text-[10px] text-brand-700 hover:bg-brand-100">
                  Direct
                </Badge>
              )}
              {isFitVector && !isDirect && (
                <Badge className="shrink-0 gap-0.5 bg-accent-50 px-1.5 py-0 text-[10px] text-accent-700 hover:bg-accent-100">
                  <Zap className="h-2.5 w-2.5" />
                  FitVector
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-surface-500">
              {job.companyName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <MatchScoreBadge score={job.matchScore} bucket={job.matchBucket} />
            <DecisionBadge label={job.decisionLabel} />
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.workMode && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              <span className="capitalize">{job.workMode}</span>
            </span>
          )}
          {salary && (
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {salary}
            </span>
          )}
          {timeAgo && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          )}
        </div>

        {/* Skills preview */}
        {job.skillsRequired.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.skillsRequired.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-600"
              >
                {skill}
              </span>
            ))}
            {job.skillsRequired.length > 5 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] text-surface-400">
                +{job.skillsRequired.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Source badges */}
        <div className="mt-2 flex items-center gap-1.5">
          {job.sources.map((source) => (
            <SourceBadge key={source} source={source} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
