"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Zap, Video, Star, ChevronDown } from "lucide-react";
import type { TrackerApplication } from "@/hooks/use-tracker";
import { getStageName } from "@/types/employer";

// Map raw DB fitvector_applications.status values → display config
const FV_RAW_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  applied:           { label: "Applied",            color: "#3B82F6" },
  under_review:      { label: "Under Review",       color: "#F59E0B" },
  interview_invited: { label: "Interview Invited",  color: "#8B5CF6" },
  interviewed:       { label: "Interviewed",        color: "#7C3AED" },
  decision_pending:  { label: "Decision Pending",   color: "#6366F1" },
  offered:           { label: "Offer Received",     color: "#10B981" },
  rejected:          { label: "Not Moved Forward",  color: "#EF4444" },
  withdrawn:         { label: "Withdrawn",          color: "#9CA3AF" },
};

// Status → funnel bucket
const FUNNEL_BUCKET: Record<string, "applied" | "inReview" | "interviewing" | "offered"> = {
  applied:           "applied",
  under_review:      "inReview",
  interview_invited: "interviewing",
  interviewed:       "interviewing",
  decision_pending:  "interviewing",
  offered:           "offered",
};

// Ordering weight for group sorting (lower = first)
const GROUP_SORT_WEIGHT: Record<string, number> = {
  offered:           0,
  interviewed:       1,
  interview_invited: 2,
  decision_pending:  3,
  under_review:      4,
  applied:           5,
  rejected:          6,
  withdrawn:         7,
};

interface AppliedJobsListProps {
  applications: TrackerApplication[];
  onCardClick: (app: TrackerApplication) => void;
  showFitVectorBadge?: boolean;
  /** Unused — filtering is done externally by parent; kept for API surface */
  filterStatus?: string;
  filterCompany?: string;
  filterRange?: string;
  searchQuery?: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day:   "numeric",
      month: "short",
      year:  "numeric",
    });
  } catch {
    return "";
  }
}

function MatchScorePill({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-100 text-green-700" :
    score >= 50 ? "bg-amber-100 text-amber-700" :
                  "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
      <Star className="h-2.5 w-2.5" />
      {score}% match
    </span>
  );
}

// ─── Application Funnel Bar ───────────────────────────────────────────────────

function FunnelBar({ applications }: { applications: TrackerApplication[] }) {
  const total = applications.length;

  let applied      = 0;
  let inReview     = 0;
  let interviewing = 0;
  let offered      = 0;

  for (const app of applications) {
    const bucket = app.fitvectorStatus ? FUNNEL_BUCKET[app.fitvectorStatus] : null;
    if (bucket === "applied")      applied++;
    else if (bucket === "inReview")     inReview++;
    else if (bucket === "interviewing") interviewing++;
    else if (bucket === "offered")      offered++;
    else                                applied++; // fallback
  }

  const conversionPct = total > 0 ? Math.round((inReview / total) * 100) : 0;

  const stages = [
    { label: "Applied",      count: applied,      color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "In Review",    count: inReview,     color: "text-amber-600",  bg: "bg-amber-50"  },
    { label: "Interviewing", count: interviewing, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Offered",      count: offered,      color: "text-emerald-600",bg: "bg-emerald-50"},
  ];

  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-1 sm:gap-2">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="flex items-center gap-1 sm:gap-2">
            <div className={`flex flex-col items-center rounded-lg px-3 py-2 ${stage.bg} min-w-[60px]`}>
              <span className={`text-lg font-bold leading-tight ${stage.color}`}>
                {stage.count}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{stage.label}</span>
            </div>
            {idx < stages.length - 1 && (
              <ChevronDown className="h-3 w-3 rotate-[-90deg] shrink-0 text-muted-foreground/40" />
            )}
          </div>
        ))}
      </div>

      {/* Conversion bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">conversion rate</span>
          <span className="text-[10px] font-medium text-emerald-600">{conversionPct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${conversionPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Single Application Card ─────────────────────────────────────────────────

function AppCard({
  app,
  onCardClick,
  showFitVectorBadge,
}: {
  app: TrackerApplication;
  onCardClick: (a: TrackerApplication) => void;
  showFitVectorBadge: boolean;
}) {
  const fvStatus    = app.fitvectorStatus;
  const statusConfig = fvStatus ? (FV_RAW_STATUS_CONFIG[fvStatus] ?? null) : null;

  const stageOrder = [
    "applied",
    "under_review",
    "interview_invited",
    "interviewed",
    "decision_pending",
    "offered",
  ];
  const currentIdx = stageOrder.indexOf(fvStatus ?? "applied");

  return (
    <Card
      className="cursor-pointer border-l-2 border-l-accent-500 transition-shadow hover:shadow-sm"
      onClick={() => onCardClick(app)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title + optional FV badge */}
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">{app.jobTitle}</h3>
              {showFitVectorBadge && (
                <Badge className="shrink-0 gap-0.5 bg-accent-50 px-1 py-0 text-[9px] text-accent-700 hover:bg-accent-100">
                  <Zap className="h-2 w-2" />
                  FV
                </Badge>
              )}
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

          {/* Status badge + interview link */}
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
          {stageOrder.map((stage, thisIdx) => {
            const isPast    = thisIdx <= currentIdx;
            const isCurrent = thisIdx === currentIdx;
            return (
              <div key={stage} className="flex items-center gap-1">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    isCurrent ? "h-2 w-2 bg-accent-500" :
                    isPast    ? "bg-accent-300"          : "bg-muted"
                  }`}
                />
                {thisIdx < stageOrder.length - 1 && (
                  <div className={`h-px w-4 ${isPast && !isCurrent ? "bg-accent-300" : "bg-muted"}`} />
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
}

// ─── Company Group Accordion ─────────────────────────────────────────────────

function bestStatusWeight(apps: TrackerApplication[]): number {
  let best = Infinity;
  for (const app of apps) {
    const w = GROUP_SORT_WEIGHT[app.fitvectorStatus ?? "applied"] ?? 99;
    if (w < best) best = w;
  }
  return best;
}

function CompanyGroup({
  company,
  apps,
  onCardClick,
  showFitVectorBadge,
}: {
  company: string;
  apps: TrackerApplication[];
  onCardClick: (a: TrackerApplication) => void;
  showFitVectorBadge: boolean;
}) {
  // Determine the best (most advanced) status in this group for the header badge
  const sortedByWeight = [...apps].sort(
    (a, b) =>
      (GROUP_SORT_WEIGHT[a.fitvectorStatus ?? "applied"] ?? 99) -
      (GROUP_SORT_WEIGHT[b.fitvectorStatus ?? "applied"] ?? 99),
  );
  const bestStatus = sortedByWeight[0]?.fitvectorStatus ?? null;
  const bestConfig = bestStatus ? (FV_RAW_STATUS_CONFIG[bestStatus] ?? null) : null;

  // Default open if group has an interesting status
  const defaultOpen =
    bestStatus === "offered" ||
    bestStatus === "interviewed" ||
    bestStatus === "interview_invited" ||
    bestStatus === "decision_pending";

  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          <span className="truncate text-sm font-semibold text-foreground">{company}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {apps.length} {apps.length === 1 ? "role" : "roles"}
          </span>
          {bestConfig && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: bestConfig.color }}
            >
              {bestConfig.label}
            </span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-2 space-y-2 pl-2">
        {sortedByWeight.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onCardClick={onCardClick}
            showFitVectorBadge={showFitVectorBadge}
          />
        ))}
      </div>
    </details>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AppliedJobsList({
  applications,
  onCardClick,
  showFitVectorBadge = false,
}: AppliedJobsListProps) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Zap className="h-10 w-10 text-accent-300" />
        <h3 className="mt-4 text-sm font-semibold text-foreground/80">No FitVector applications yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Apply to jobs via FitVector and they&apos;ll appear here, tracked by the employer.
        </p>
      </div>
    );
  }

  // Group by company
  const groupMap = new Map<string, TrackerApplication[]>();
  for (const app of applications) {
    const key = app.companyName;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(app);
  }

  // Sort groups by best status weight
  const sortedGroups = [...groupMap.entries()].sort(
    ([, aApps], [, bApps]) => bestStatusWeight(aApps) - bestStatusWeight(bApps),
  );

  return (
    <div className="space-y-3">
      {/* Application funnel bar */}
      <FunnelBar applications={applications} />

      {/* Company-grouped accordion */}
      <div className="space-y-2">
        {sortedGroups.map(([company, apps]) => (
          <CompanyGroup
            key={company}
            company={company}
            apps={apps}
            onCardClick={onCardClick}
            showFitVectorBadge={showFitVectorBadge}
          />
        ))}
      </div>
    </div>
  );
}
