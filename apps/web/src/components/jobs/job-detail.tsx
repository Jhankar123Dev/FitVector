"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchScoreBadge } from "./match-score-badge";
import { DecisionBadge } from "./decision-badge";
import { SourceBadge } from "./source-badge";
import { ActionBar } from "./action-bar";
import { GapAnalysisPanel } from "./gap-analysis-panel";
import {
  MapPin,
  Clock,
  Briefcase,
  IndianRupee,
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { JobSearchResult } from "@/types/job";

interface JobDetailProps {
  job: JobSearchResult;
  userSkills?: string[];
  onBack: () => void;
  onTailorResume?: () => void;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return "";
  }
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)} / year`;
  if (min) return `${fmt(min)}+ / year`;
  if (max) return `Up to ${fmt(max)} / year`;
  return null;
}

export function JobDetailPanel({ job, userSkills = [], onBack, onTailorResume }: JobDetailProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const timeAgo = formatTimeAgo(job.postedAt);

  // Use deterministic components for skill match if available
  const detComponents = job.deterministicComponents;
  const matching = detComponents?.requiredSkillsMatch?.matched ||
    job.skillsRequired.filter((s) =>
      userSkills.some((us) => us.toLowerCase() === s.toLowerCase()),
    );
  const missing = detComponents?.requiredSkillsMatch?.missing ||
    job.skillsRequired.filter(
      (s) => !userSkills.some((us) => us.toLowerCase() === s.toLowerCase()),
    );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-3 -ml-2 gap-1 text-xs lg:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to results
        </Button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{job.title}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {job.companyName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <MatchScoreBadge
              score={job.matchScore}
              bucket={job.matchBucket}
              showLabel
              size="md"
            />
            <DecisionBadge label={job.decisionLabel} size="md" />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
          )}
          {job.workMode && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="capitalize">{job.workMode}</span>
            </span>
          )}
          {salary && (
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {salary}
            </span>
          )}
          {timeAgo && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo}
            </span>
          )}
        </div>

        {/* Sources */}
        <div className="mt-2 flex items-center gap-1.5">
          {job.sources.map((source) => (
            <SourceBadge key={source} source={source} />
          ))}
        </div>
      </div>

      {/* Skills Match Visualization */}
      {(matching.length > 0 || missing.length > 0) && (
        <div className="border-b p-4">
          <h3 className="mb-2 text-sm font-semibold">Skills Match</h3>
          {detComponents?.requiredSkillsMatch && (
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${Math.round(detComponents.requiredSkillsMatch.ratio * 100)}%`,
                }}
              />
            </div>
          )}
          <div className="space-y-2">
            {matching.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  You have ({matching.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matching.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="gap-1 bg-green-50 text-green-700"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  To learn ({missing.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="gap-1 bg-red-50 text-red-700"
                    >
                      <XCircle className="h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gap Analysis — triggered by button click */}
      <div className="border-b px-4 py-3">
        <GapAnalysisPanel job={job} />
      </div>

      {/* Description */}
      <div className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Job Description</h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          {job.description ? (
            <div className="whitespace-pre-wrap text-sm">{job.description}</div>
          ) : (
            <p className="italic">No description available.</p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <ActionBar job={job} onTailorResume={onTailorResume} />
    </div>
  );
}
