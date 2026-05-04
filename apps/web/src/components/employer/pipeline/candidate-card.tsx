"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Applicant } from "@/types/employer";
import { SOURCE_LABELS } from "@/types/employer";

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-brand-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function scoreBgColor(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 60) return "bg-brand-50 text-brand-700";
  if (score >= 40) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

const SOURCE_COLORS: Record<string, string> = {
  fitvector: "bg-brand-50 text-brand-600",
  external: "bg-muted text-muted-foreground",
  referral: "bg-accent-50 text-accent-700",
  imported: "bg-sky-50 text-sky-600",
};

interface CandidateCardProps {
  applicant: Applicant;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (applicant: Applicant) => void;
  compact?: boolean;
}

export function CandidateCard({
  applicant,
  selected,
  onSelect,
  onClick,
  compact,
}: CandidateCardProps) {
  const initials = applicant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:shadow-card",
        selected
          ? "border-brand-500 ring-1 ring-brand-500"
          : "border-border hover:border-border/80",
        compact && "p-2",
      )}
      onClick={() => onClick?.(applicant)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(applicant.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 rounded border-border text-brand-500 focus:ring-brand-200"
          />
        )}

        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="truncate text-sm font-medium text-foreground">
              {applicant.name}
            </p>
            {applicant.screeningScore > 0 ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                  scoreColor(applicant.screeningScore),
                )}
              >
                AI Match: {applicant.screeningScore}
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                Not scored
              </span>
            )}
            {applicant.testScore !== null && applicant.testScore !== undefined && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                  scoreColor(applicant.testScore),
                )}
              >
                Test: {applicant.testScore}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {applicant.currentRole} @ {applicant.currentCompany}
          </p>

          {!compact && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  SOURCE_COLORS[applicant.source] || SOURCE_COLORS.external,
                )}
              >
                {SOURCE_LABELS[applicant.source]}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {formatRelativeTime(applicant.appliedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Table row variant ───────────────────────────────────────────────
interface CandidateRowProps {
  applicant: Applicant;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (applicant: Applicant) => void;
}

export function CandidateRow({
  applicant,
  selected,
  onSelect,
  onClick,
}: CandidateRowProps) {
  const initials = applicant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
        selected && "bg-brand-50/50",
      )}
      onClick={() => onClick?.(applicant)}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect?.(applicant.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-border text-brand-500 focus:ring-brand-200"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {applicant.name}
            </p>
            <p className="text-xs text-muted-foreground">{applicant.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-foreground/80">{applicant.currentRole}</p>
        <p className="text-xs text-muted-foreground/70">{applicant.currentCompany}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {applicant.screeningScore > 0 ? (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-bold w-fit",
                scoreBgColor(applicant.screeningScore),
              )}
            >
              AI Match: {applicant.screeningScore}
            </span>
          ) : (
            <span className="inline-flex w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground/70">
              —
            </span>
          )}
          {applicant.testScore !== null && applicant.testScore !== undefined && (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-bold w-fit",
                scoreBgColor(applicant.testScore),
              )}
            >
              Test: {applicant.testScore}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            SOURCE_COLORS[applicant.source] || SOURCE_COLORS.external,
          )}
        >
          {SOURCE_LABELS[applicant.source]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(applicant.appliedAt)}
        </span>
      </td>
    </tr>
  );
}
