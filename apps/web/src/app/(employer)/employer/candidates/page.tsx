"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  Eye,
} from "lucide-react";
import { Skeleton, SkeletonCandidateRow } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAllApplicants } from "@/hooks/use-applicants";
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  PIPELINE_STAGE_LABELS,
  PIPELINE_COLUMNS,
  type Applicant,
  type ScreeningBucket,
  type PipelineStage,
} from "@/types/employer";

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState<ScreeningBucket | "all">("all");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all");

  const { data: applicantsData, isLoading } = useAllApplicants();
  const allApplicants = (applicantsData?.data || []) as unknown as Applicant[];

  const filtered = useMemo(() => {
    let result = [...allApplicants];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.currentRole || "").toLowerCase().includes(q),
      );
    }
    if (bucketFilter !== "all") {
      result = result.filter((a) => a.screeningBucket === bucketFilter);
    }
    if (stageFilter !== "all") {
      result = result.filter((a) => a.pipelineStage === stageFilter);
    }

    return result.sort(
      (a, b) => (b.screeningScore ?? 0) - (a.screeningScore ?? 0),
    );
  }, [allApplicants, search, bucketFilter, stageFilter]);

  const totalCount = allApplicants.length;
  const strongFitCount = allApplicants.filter((a) => a.screeningBucket === "strong_fit").length;

  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64 opacity-60" />
        </div>
        {/* Search bar + filter chips row */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[80, 72, 68, 64, 60].map((w, i) => (
            <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
          ))}
        </div>
        {/* Candidate rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCandidateRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">All Candidates</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} candidates across all job postings · {strongFitCount} strong fits
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-3 sm:p-4">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              placeholder="Search name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Bucket filter */}
          <div className="flex gap-1">
            {(["all", "strong_fit", "good_fit", "potential_fit", "weak_fit"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBucketFilter(b)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  bucketFilter === b
                    ? "bg-brand-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted",
                )}
              >
                {b === "all" ? "All" : BUCKET_LABELS[b]}
              </button>
            ))}
          </div>

          {/* Stage filter */}
          <div className="flex gap-1 sm:ml-auto">
            <button
              onClick={() => setStageFilter("all")}
              className={cn(
                "hidden rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:block",
                stageFilter === "all"
                  ? "bg-foreground text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted",
              )}
            >
              All Stages
            </button>
            {PIPELINE_COLUMNS.map((s) => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn(
                  "hidden rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:block",
                  stageFilter === s
                    ? "bg-foreground text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted",
                )}
              >
                {PIPELINE_STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Current Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Applied</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((applicant) => {
                  const bucketClasses = BUCKET_COLORS[applicant.screeningBucket];
                  const stageLabel = PIPELINE_STAGE_LABELS[applicant.pipelineStage];
                  const appliedDate = new Date(applicant.appliedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <tr key={applicant.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {applicant.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{applicant.name}</p>
                            <p className="text-xs text-muted-foreground/70">{applicant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {applicant.currentRole} at {applicant.currentCompany}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="brand" className="text-[10px]">
                          {stageLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px]", bucketClasses)}>
                          {BUCKET_LABELS[applicant.screeningBucket]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {applicant.screeningScore ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {appliedDate}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/employer/jobs/${applicant.jobPostId}/pipeline`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No candidates match your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
