"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  LayoutGrid,
  TableProperties,
  ArrowRight,
  XCircle,
  Send,
  ClipboardCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Users,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CandidateCard } from "@/components/employer/pipeline/candidate-card";
import { CandidateDetail } from "@/components/employer/pipeline/candidate-detail";
import {
  useApplicants,
  useChangeApplicantStage,
  useRejectApplicant,
  useScreenApplicant,
  useBulkScreen,
} from "@/hooks/use-applicants";
import { useEmployerJob } from "@/hooks/use-employer-jobs";
import { useInviteInterview } from "@/hooks/use-interviews";
import type { Applicant, PipelineStage } from "@/types/employer";
import { PIPELINE_STAGE_LABELS, PIPELINE_COLUMNS } from "@/types/employer";

// ── Column colors ───────────────────────────────────────────────────
const COLUMN_COLORS: Record<PipelineStage, string> = {
  applied: "border-t-surface-400",
  ai_screened: "border-t-brand-400",
  ai_interviewed: "border-t-brand-600",
  assessment: "border-t-amber-500",
  human_interview: "border-t-sky-500",
  offer: "border-t-emerald-500",
  hired: "border-t-emerald-600",
  rejected: "border-t-red-400",
};

type ViewMode = "kanban" | "table";

export default function PipelinePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // Real data hooks
  const { data: jobData } = useEmployerJob(jobId);
  const [page, setPage] = useState(1);
  const { data: applicantsData, isLoading } = useApplicants(jobId, { page: String(page) });
  const changeStage = useChangeApplicantStage();
  const rejectMutation = useRejectApplicant();
  const screenApplicant = useScreenApplicant();
  const bulkScreenMutation = useBulkScreen();
  const inviteInterview = useInviteInterview();

  const job = jobData?.data;
  const applicants = (applicantsData?.data || []) as unknown as Applicant[];

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailApplicant, setDetailApplicant] = useState<Applicant | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  // ── Filters ─────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [filterScoreMin, setFilterScoreMin] = useState(0);
  const [filterScoreMax, setFilterScoreMax] = useState(100);
  const [filterSkill, setFilterSkill] = useState("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterExpMin, setFilterExpMin] = useState(0);
  const [filterExpMax, setFilterExpMax] = useState(30);

  // ── Filtering logic ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      if (a.screeningScore > 0 && (a.screeningScore < filterScoreMin || a.screeningScore > filterScoreMax))
        return false;
      if (filterSkill) {
        const skill = filterSkill.toLowerCase();
        const skills = a.parsedResume?.skills || [];
        if (!skills.some((s: string) => s.toLowerCase().includes(skill)))
          return false;
      }
      if (filterSource && a.source !== filterSource) return false;
      if (a.experience < filterExpMin || a.experience > filterExpMax) return false;
      return true;
    });
  }, [applicants, filterScoreMin, filterScoreMax, filterSkill, filterSource, filterExpMin, filterExpMax]);

  // ── Group by stage ──────────────────────────────────────────────
  const byStage = useMemo(() => {
    const map: Record<PipelineStage, Applicant[]> = {
      applied: [], ai_screened: [], ai_interviewed: [], assessment: [],
      human_interview: [], offer: [], hired: [], rejected: [],
    };
    for (const a of filtered) {
      map[a.pipelineStage].push(a);
    }
    return map;
  }, [filtered]);

  // ── Selection helpers ───────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ── Stage transitions ───────────────────────────────────────────
  const NEXT_STAGE: Record<string, PipelineStage> = {
    applied: "ai_screened",
    ai_screened: "ai_interviewed",
    ai_interviewed: "assessment",
    assessment: "human_interview",
    human_interview: "offer",
    offer: "hired",
  };

  const PREV_STAGE: Record<string, PipelineStage> = {
    ai_screened: "applied",
    ai_interviewed: "ai_screened",
    assessment: "ai_interviewed",
    human_interview: "assessment",
    offer: "human_interview",
    hired: "offer",
  };

  function advanceApplicant(id: string) {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;
    const next = NEXT_STAGE[applicant.pipelineStage];
    if (next) {
      changeStage.mutate({ id, stage: next });
    }
    setDetailApplicant(null);
  }

  function goBackApplicant(id: string) {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;
    const prev = PREV_STAGE[applicant.pipelineStage];
    if (prev) {
      changeStage.mutate({ id, stage: prev });
    }
    setDetailApplicant(null);
  }

  function handleRejectApplicant(id: string) {
    rejectMutation.mutate({ id, reason: "Not a fit for this role" });
    setDetailApplicant(null);
  }

  function handleScreenApplicant(id: string) {
    screenApplicant.mutate(id);
  }

  // Screen only the currently selected applicants (not all-at-once)
  function handleBulkScreen() {
    for (const id of selectedIds) {
      screenApplicant.mutate(id);
    }
    clearSelection();
  }

  function bulkAdvance() {
    for (const id of selectedIds) {
      const applicant = applicants.find((a) => a.id === id);
      if (applicant) {
        const next = NEXT_STAGE[applicant.pipelineStage];
        if (next) changeStage.mutate({ id, stage: next });
      }
    }
    clearSelection();
  }

  function bulkReject() {
    for (const id of selectedIds) {
      rejectMutation.mutate({ id, reason: "Bulk rejection" });
    }
    clearSelection();
  }

  const hasActiveFilters = filterScoreMin > 0 || filterScoreMax < 100 || filterSkill || filterSource || filterExpMin > 0 || filterExpMax < 30;

  return (
    <div className="flex h-full flex-col -m-3 sm:-m-4 md:-m-6">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="border-b border-surface-200 bg-white px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => router.push("/employer/jobs")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-lg font-semibold text-surface-800">
                {job?.title || "Loading..."}
              </h1>
              <p className="truncate text-[11px] sm:text-xs text-surface-500">
                {applicantsData?.total ?? filtered.length} total &middot; {filtered.length} showing &middot;{" "}
                {job?.location || ""} &middot; {job?.department || ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-surface-200 p-0.5">
              <button
                className={cn(
                  "rounded-md px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-surface-100 text-surface-800"
                    : "text-surface-500 hover:text-surface-700",
                )}
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="inline h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                className={cn(
                  "rounded-md px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-surface-100 text-surface-800"
                    : "text-surface-500 hover:text-surface-700",
                )}
                onClick={() => setViewMode("table")}
              >
                <TableProperties className="inline h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Filters toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 sm:gap-1.5 h-8 px-2 sm:px-3"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="ml-0.5 h-2 w-2 rounded-full bg-brand-500" />
              )}
            </Button>
          </div>
        </div>

        {/* ── Bulk actions bar ──────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 sm:px-4 sm:py-2.5">
            <span className="text-xs sm:text-sm font-medium text-brand-700">
              {selectedIds.size} selected
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Run AI Screening — only show for unscreened applicants */}
              <Button
                size="sm"
                onClick={handleBulkScreen}
                disabled={screenApplicant.isPending}
                className="gap-1 h-7 text-xs sm:h-8 sm:text-sm sm:gap-1.5 bg-brand-600 hover:bg-brand-700 text-white"
              >
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {screenApplicant.isPending ? "Screening…" : `AI Screen (${selectedIds.size})`}
              </Button>
              <Button size="sm" onClick={bulkAdvance} className="gap-1 h-7 text-xs sm:h-8 sm:text-sm sm:gap-1.5">
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Advance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkReject}
                className="gap-1 h-7 text-xs sm:h-8 sm:text-sm sm:gap-1.5 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:inline-flex gap-1.5 h-8"
                onClick={() => {
                  for (const id of selectedIds) {
                    inviteInterview.mutate({ applicantId: id });
                  }
                  clearSelection();
                }}
                disabled={inviteInterview.isPending}
              >
                <Send className="h-3.5 w-3.5" />
                {inviteInterview.isPending ? "Sending…" : "Send AI Interview"}
              </Button>
              <Button variant="outline" size="sm" className="hidden md:inline-flex gap-1.5 h-8">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Send Assessment
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs sm:h-8 sm:text-sm">
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* ── Filters panel ────────────────────────────────────── */}
        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 sm:p-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-surface-600">
                Score Min
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={filterScoreMin}
                onChange={(e) => setFilterScoreMin(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-surface-600">
                Score Max
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={filterScoreMax}
                onChange={(e) => setFilterScoreMax(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-surface-600">
                Skill
              </label>
              <Input
                placeholder="e.g. React"
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-surface-600">
                Source
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="h-8 w-full rounded-lg border border-surface-200 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">All</option>
                <option value="fitvector">FitVector</option>
                <option value="external">External</option>
                <option value="referral">Referral</option>
                <option value="imported">Imported</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] sm:text-xs font-medium text-surface-600">
                  Exp Min
                </label>
                <Input
                  type="number"
                  min={0}
                  value={filterExpMin}
                  onChange={(e) => setFilterExpMin(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[11px] sm:text-xs font-medium text-surface-600">
                  Exp Max
                </label>
                <Input
                  type="number"
                  min={0}
                  value={filterExpMax}
                  onChange={(e) => setFilterExpMax(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {viewMode === "kanban" ? (
          /* ═══════════ KANBAN VIEW ═══════════════════════════════ */
          <div
            className="flex h-full gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-4 md:px-6"
            style={{ minWidth: "fit-content" }}
          >
            {PIPELINE_COLUMNS.map((stage) => {
              const items = byStage[stage];
              return (
                <div
                  key={stage}
                  className={cn(
                    "flex w-[220px] sm:w-[250px] md:w-[260px] shrink-0 flex-col rounded-lg border-t-[3px] bg-surface-50",
                    COLUMN_COLORS[stage],
                  )}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5">
                    <span className="text-[11px] sm:text-xs font-semibold text-surface-700">
                      {PIPELINE_STAGE_LABELS[stage]}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {items.length}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-1.5 sm:space-y-2 overflow-y-auto px-1.5 pb-2 sm:px-2">
                    {items.length === 0 ? (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-200 py-6 sm:py-8">
                        <p className="text-[11px] sm:text-xs text-surface-400">No candidates</p>
                      </div>
                    ) : (
                      items.map((a) => (
                        <CandidateCard
                          key={a.id}
                          applicant={a}
                          selected={selectedIds.has(a.id)}
                          onSelect={toggleSelect}
                          onClick={() => setDetailApplicant(a)}
                          compact
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Rejected column (collapsible) */}
            <div
              className={cn(
                "flex shrink-0 flex-col rounded-lg border-t-[3px] bg-surface-50",
                COLUMN_COLORS.rejected,
                showRejected ? "w-[220px] sm:w-[250px] md:w-[260px]" : "w-[44px] sm:w-[50px]",
              )}
            >
              <button
                className="flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5"
                onClick={() => setShowRejected(!showRejected)}
              >
                {showRejected ? (
                  <>
                    <span className="text-[11px] sm:text-xs font-semibold text-surface-700">
                      Rejected
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {byStage.rejected.length}
                      </Badge>
                      <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <ChevronRight className="h-3.5 w-3.5 text-surface-400" />
                    <span className="text-[10px] font-semibold text-surface-500 [writing-mode:vertical-rl] rotate-180">
                      Rejected ({byStage.rejected.length})
                    </span>
                  </div>
                )}
              </button>

              {showRejected && (
                <div className="flex-1 space-y-1.5 sm:space-y-2 overflow-y-auto px-1.5 pb-2 sm:px-2">
                  {byStage.rejected.map((a) => (
                    <CandidateCard
                      key={a.id}
                      applicant={a}
                      selected={selectedIds.has(a.id)}
                      onSelect={toggleSelect}
                      onClick={() => setDetailApplicant(a)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ═══════════ TABLE VIEW ════════════════════════════════ */
          <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50">
                      <th className="w-10 px-3 py-2.5 sm:px-4 sm:py-3">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(new Set(filtered.map((a) => a.id)));
                            } else {
                              clearSelection();
                            }
                          }}
                          checked={selectedIds.size === filtered.length && filtered.length > 0}
                          className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
                        />
                      </th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">
                        Candidate
                      </th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">
                        Current Role
                      </th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">
                        Score
                      </th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">
                        Source
                      </th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">
                        Stage
                      </th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">
                        Applied
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <CandidateTableRow
                        key={a.id}
                        applicant={a}
                        selected={selectedIds.has(a.id)}
                        onSelect={toggleSelect}
                        onClick={() => setDetailApplicant(a)}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 sm:py-16 text-center">
                          <Users className="mx-auto h-8 w-8 text-surface-300" />
                          <p className="mt-2 text-sm text-surface-500">
                            No candidates match your filters
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {applicantsData?.hasMore && (
                <div className="flex justify-center border-t border-surface-100 px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...</>
                    ) : (
                      <>Load more candidates</>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ── Candidate detail slide-over ──────────────────────────── */}
      {detailApplicant && (
        <CandidateDetail
          applicant={detailApplicant}
          onClose={() => setDetailApplicant(null)}
          onAdvance={advanceApplicant}
          onGoBack={goBackApplicant}
          onReject={handleRejectApplicant}
        />
      )}
    </div>
  );
}

// ── Table row for the table view (with stage column) ────────────────
function CandidateTableRow({
  applicant,
  selected,
  onSelect,
  onClick,
}: {
  applicant: Applicant;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (applicant: Applicant) => void;
}) {
  const initials = applicant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const scoreBg =
    applicant.screeningScore >= 80
      ? "bg-emerald-50 text-emerald-700"
      : applicant.screeningScore >= 60
        ? "bg-brand-50 text-brand-700"
        : applicant.screeningScore >= 40
          ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-700";

  const SOURCE_COLORS: Record<string, string> = {
    fitvector: "bg-brand-50 text-brand-600",
    external: "bg-surface-100 text-surface-600",
    referral: "bg-accent-50 text-accent-700",
    imported: "bg-sky-50 text-sky-600",
  };

  const SOURCE_LABELS: Record<string, string> = {
    fitvector: "FitVector",
    external: "External",
    referral: "Referral",
    imported: "Imported",
  };

  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-surface-100 transition-colors hover:bg-surface-50",
        selected && "bg-brand-50/50",
      )}
      onClick={() => onClick?.(applicant)}
    >
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect?.(applicant.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
        />
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] sm:text-xs font-semibold text-surface-600">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs sm:text-sm font-medium text-surface-800">
              {applicant.name}
            </p>
            <p className="truncate text-[11px] sm:text-xs text-surface-500">{applicant.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-xs sm:text-sm text-surface-700">{applicant.currentRole}</p>
        <p className="text-[11px] sm:text-xs text-surface-400">{applicant.currentCompany}</p>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {applicant.screeningScore > 0 ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-bold",
              scoreBg,
            )}
          >
            {applicant.screeningScore}
          </span>
        ) : (
          <span className="text-xs text-surface-400">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-medium",
            SOURCE_COLORS[applicant.source] || SOURCE_COLORS.external,
          )}
        >
          {SOURCE_LABELS[applicant.source]}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <Badge variant="outline" className="text-[10px] sm:text-[11px]">
          {PIPELINE_STAGE_LABELS[applicant.pipelineStage]}
        </Badge>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">
          {new Date(applicant.appliedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </td>
    </tr>
  );
}
