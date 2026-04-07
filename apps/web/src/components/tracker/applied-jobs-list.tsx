"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Zap, Video, Star } from "lucide-react";
import type { TrackerApplication } from "@/hooks/use-tracker";
import { getStageName } from "@/types/employer";
// Map raw DB fitvector_applications.status values → display config
const FV_RAW_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  applied:          { label: "Applied", color: "#3B82F6" },
  under_review:     { label: "Under Review", color: "#F59E0B" },
  interview_invited:{ label: "Interview Invited", color: "#8B5CF6" },
  interviewed:      { label: "Interviewed", color: "#7C3AED" },
  decision_pending: { label: "Decision Pending", color: "#6366F1" },
  offered:          { label: "Offer Received", color: "#10B981" },
  rejected:         { label: "Not Moved Forward", color: "#EF4444" },
  withdrawn:        { label: "Withdrawn", color: "#9CA3AF" },
};

interface AppliedJobsListProps {
  applications: TrackerApplication[];
  onCardClick: (app: TrackerApplication) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function MatchScorePill({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-100 text-green-700" :
    score >= 50 ? "bg-amber-100 text-amber-700" :
    "bg-surface-100 text-surface-600";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
      <Star className="h-2.5 w-2.5" />
      {score}% match
    </span>
  );
}

export function AppliedJobsList({ applications, onCardClick }: AppliedJobsListProps) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Zap className="h-10 w-10 text-accent-300" />
        <h3 className="mt-4 text-sm font-semibold text-surface-700">No FitVector applications yet</h3>
        <p className="mt-1 text-xs text-surface-500">
          Apply to jobs via FitVector and they&apos;ll appear here, tracked by the employer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const fvStatus = app.fitvectorStatus; // string | null from raw DB
        const statusConfig = fvStatus ? (FV_RAW_STATUS_CONFIG[fvStatus] ?? null) : null;

        return (
          <Card
            key={app.id}
            className="cursor-pointer border-l-2 border-l-accent-500 transition-shadow hover:shadow-sm"
            onClick={() => onCardClick(app)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Title + FV badge */}
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-surface-800">{app.jobTitle}</h3>
                    <Badge className="shrink-0 gap-0.5 bg-accent-50 px-1 py-0 text-[9px] text-accent-700 hover:bg-accent-100">
                      <Zap className="h-2 w-2" />
                      FV
                    </Badge>
                  </div>

                  {/* Company */}
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {app.companyName}
                  </p>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {app.appliedAt && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-2.5 w-2.5" />
                        Applied {formatDate(app.appliedAt)}
                      </span>
                    )}
                    {app.matchScore !== null && app.matchScore > 0 && (
                      <MatchScorePill score={app.matchScore} />
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {statusConfig && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: statusConfig.color }}
                    >
                      {app.isTransparentPipeline && app.rawPipelineStage
                        ? getStageName(app.rawPipelineStage)
                        : statusConfig.label}
                    </span>
                  )}
                  {app.interviewLink && (
                    <a
                      href={app.interviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 hover:bg-violet-200"
                    >
                      <Video className="h-2.5 w-2.5" />
                      Start Interview
                    </a>
                  )}
                </div>
              </div>

              {/* Stage timeline — mini dots */}
              <div className="mt-3 flex items-center gap-1">
                {["applied", "under_review", "interview_invited", "interviewed", "decision_pending", "offered"].map((stage) => {
                  const stageOrder = ["applied", "under_review", "interview_invited", "interviewed", "decision_pending", "offered"];
                  const currentIdx = stageOrder.indexOf(fvStatus ?? "applied");
                  const thisIdx = stageOrder.indexOf(stage);
                  const isPast = thisIdx <= currentIdx;
                  const isCurrent = thisIdx === currentIdx;
                  return (
                    <div key={stage} className="flex items-center gap-1">
                      <div
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          isCurrent ? "h-2 w-2 bg-accent-500" :
                          isPast ? "bg-accent-300" : "bg-surface-200"
                        }`}
                      />
                      {thisIdx < stageOrder.length - 1 && (
                        <div className={`h-px w-4 ${isPast && !isCurrent ? "bg-accent-300" : "bg-surface-200"}`} />
                      )}
                    </div>
                  );
                })}
                {fvStatus === "rejected" && (
                  <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-600">
                    Not moved forward
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
