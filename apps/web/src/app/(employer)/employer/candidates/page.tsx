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
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MOCK_APPLICANTS } from "@/lib/mock/employer-data";
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

  const filtered = useMemo(() => {
    let result = [...MOCK_APPLICANTS];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.currentRole.toLowerCase().includes(q),
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
  }, [search, bucketFilter, stageFilter]);

  const totalCount = MOCK_APPLICANTS.length;
  const strongFitCount = MOCK_APPLICANTS.filter((a) => a.screeningBucket === "strong_fit").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-800">All Candidates</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          {totalCount} candidates across all job postings · {strongFitCount} strong fits
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-3 sm:p-4">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
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
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200",
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
                  ? "bg-surface-800 text-white"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200",
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
                    ? "bg-surface-800 text-white"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200",
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
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Current Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Fit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">Score</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">Applied</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">Actions</th>
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
                    <tr key={applicant.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {applicant.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-surface-800">{applicant.name}</p>
                            <p className="text-xs text-surface-400">{applicant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-600">
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
                        <span className="text-sm font-semibold text-surface-800">
                          {applicant.screeningScore ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-surface-500">
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
              <Users className="mb-2 h-8 w-8 text-surface-300" />
              <p className="text-sm text-surface-500">No candidates match your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
