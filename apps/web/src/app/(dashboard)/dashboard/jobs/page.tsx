"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, Loader2, MapPin, Zap, Globe, LayoutGrid, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobList } from "@/components/jobs/job-list";
import { JobDetailPanel } from "@/components/jobs/job-detail";
import { JobFiltersPanel } from "@/components/jobs/job-filters";
import type { JobFilters } from "@/components/jobs/job-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { UpgradePrompt } from "@/components/shared/upgrade-prompt";
import { TailorDialog } from "@/components/resume/tailor-dialog";
import { FitVectorApplyModal } from "@/components/jobs/fitvector-apply-modal";
import { useJobSearch } from "@/hooks/use-jobs";
import { useUser } from "@/hooks/use-user";
import type { JobSearchParams, JobSearchResult, JobView } from "@/types/job";

const DEFAULT_FILTERS: JobFilters = {
  location: "",
  workMode: "",
  jobType: "",
  hoursOld: 720,
  salaryMin: "",
  salaryMax: "",
  decisionLabel: "",
};

const TABS: { id: JobView; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: "all",
    label: "All Jobs",
    icon: LayoutGrid,
    description: "FitVector + LinkedIn, Indeed & more",
  },
  {
    id: "fitvector",
    label: "FitVector",
    icon: Zap,
    description: "Employer-posted, direct apply",
  },
  {
    id: "external",
    label: "External",
    icon: Globe,
    description: "LinkedIn, Indeed, ZipRecruiter",
  },
];

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Read initial tab from URL
  const urlTab = searchParams.get("tab") as JobView | null;
  const [activeTab, setActiveTab] = useState<JobView>(
    urlTab && ["all", "fitvector", "external"].includes(urlTab) ? urlTab : "all",
  );

  const [query, setQuery] = useState("");
  const [jobSearchParams, setJobSearchParams] = useState<JobSearchParams | null>(null);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [selectedJob, setSelectedJob] = useState<JobSearchResult | null>(null);
  const [tailorJob, setTailorJob] = useState<JobSearchResult | null>(null);
  const [applyJob, setApplyJob] = useState<JobSearchResult | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    isError,
  } = useJobSearch(jobSearchParams);

  const allJobs = useMemo(() => {
    return data?.pages ? data.pages.flatMap((page) => page.data.jobs) : [];
  }, [data]);

  const totalJobs = data?.pages?.[0]?.data.total ?? 0;
  const usage = data?.pages?.[0]?.data.usage;

  // Sync active tab to URL param
  const handleTabChange = useCallback(
    (tab: JobView) => {
      setActiveTab(tab);
      setSelectedJob(null);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "all") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      router.replace(`?${params.toString()}`, { scroll: false });

      // Re-trigger search with new view if already searched
      if (jobSearchParams) {
        setJobSearchParams((prev) => prev ? { ...prev, view: tab } : prev);
      }
    },
    [router, searchParams, jobSearchParams],
  );

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setSelectedJob(null);
    setJobSearchParams({
      role: query.trim(),
      location: filters.location || undefined,
      workMode: (filters.workMode || undefined) as JobSearchParams["workMode"],
      jobType: (filters.jobType || undefined) as JobSearchParams["jobType"],
      hoursOld: activeTab === "fitvector" ? undefined : filters.hoursOld,
      salaryMin: filters.salaryMin ? Number(filters.salaryMin) : undefined,
      salaryMax: filters.salaryMax ? Number(filters.salaryMax) : undefined,
      decisionLabel: filters.decisionLabel || undefined,
      view: activeTab,
    });
  }, [query, filters, activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFiltersChange = useCallback(
    (newFilters: JobFilters) => {
      setFilters(newFilters);
      if (
        jobSearchParams &&
        newFilters.decisionLabel !== filters.decisionLabel
      ) {
        setSelectedJob(null);
        setJobSearchParams({
          ...jobSearchParams,
          decisionLabel: newFilters.decisionLabel || undefined,
        });
      }
    },
    [jobSearchParams, filters.decisionLabel],
  );

  const isLimitReached = isError && (error as Error)?.message?.includes("limit");

  const isFitVectorTab = activeTab === "fitvector";
  const isExternalTab = activeTab === "external";

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex-none space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-surface-800">Job Search</h1>
            <p className="text-sm text-surface-500">
              {isFitVectorTab
                ? "Jobs posted directly by employers on FitVector"
                : isExternalTab
                  ? "Jobs scraped from LinkedIn, Indeed, ZipRecruiter"
                  : "Search across FitVector and multiple external platforms"}
            </p>
          </div>

          {/* Usage counter (external / all only) */}
          {usage && usage.limit !== Infinity && (
            <div className="hidden text-right text-xs text-surface-500 sm:block">
              <span className="font-medium">
                {usage.used} of {usage.limit}
              </span>{" "}
              searches used today
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-lg border bg-surface-50 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive && tab.id === "fitvector"
                      ? "text-violet-600"
                      : isActive
                        ? "text-surface-700"
                        : ""
                  }`}
                />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* FitVector tab badge */}
        {isFitVectorTab && (
          <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span>
              FitVector jobs support one-click apply with your saved resume and go straight into the employer&apos;s pipeline.
            </span>
          </div>
        )}

        {/* External tab disclaimer */}
        {isExternalTab && !isLoading && !jobSearchParams && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>External searches scrape live results — expect 60–90 seconds per search.</span>
          </div>
        )}

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              placeholder="Job title... e.g. Frontend Developer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <div className="relative w-40 shrink-0 sm:w-48">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              placeholder="City or Remote"
              value={filters.location}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Filters — hide hoursOld on FitVector tab */}
        <JobFiltersPanel
          filters={filters}
          onChange={handleFiltersChange}
          hideHoursOld={isFitVectorTab}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            if (jobSearchParams) {
              setJobSearchParams({ ...jobSearchParams, decisionLabel: undefined });
            }
          }}
        />
      </div>

      {/* Limit reached */}
      {isLimitReached && (
        <UpgradePrompt
          message="You've reached your daily search limit."
          feature="unlimited job searches"
        />
      )}

      {/* Error state */}
      {isError && !isLimitReached && (
        <EmptyState
          icon={SearchX}
          title="Search failed"
          description={(error as Error)?.message || "Something went wrong. Please try again."}
          action={
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Retry
            </Button>
          }
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <LoadingSpinner
          message={
            isFitVectorTab
              ? "Loading FitVector jobs..."
              : "Searching across job platforms..."
          }
        />
      )}

      {/* No search yet */}
      {!jobSearchParams && !isLoading && (
        <EmptyState
          icon={isFitVectorTab ? Zap : Search}
          title={isFitVectorTab ? "Browse FitVector jobs" : "Start your job search"}
          description={
            isFitVectorTab
              ? "Enter a role above to find jobs posted directly by employers — no external redirects."
              : isExternalTab
                ? "Enter a role and location above — we'll scrape LinkedIn, Indeed, and more."
                : "Enter a role and location above — we'll search FitVector and external platforms."
          }
        />
      )}

      {/* Results */}
      {jobSearchParams && !isLoading && !isError && (
        <>
          {allJobs.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No jobs found"
              description={
                isFitVectorTab
                  ? "No active FitVector jobs match this search. Try broader terms or check back later."
                  : "Try broadening your search terms or adjusting filters."
              }
            />
          ) : (
            <>
              {/* Results count */}
              <div className="mb-3 flex items-center gap-2 text-xs text-surface-500">
                <span>
                  {totalJobs} job{totalJobs !== 1 ? "s" : ""} found
                </span>
                {isFitVectorTab && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">
                    <Zap className="h-3 w-3" />
                    Direct apply
                  </span>
                )}
              </div>

              {/* Split layout: list + detail */}
              <div className="flex min-h-[400px] flex-1 gap-4">
                {/* Left: Job list */}
                <div
                  className={`overflow-y-auto ${
                    selectedJob ? "hidden w-full lg:block lg:w-2/5" : "w-full"
                  }`}
                >
                  <JobList
                    jobs={allJobs}
                    selectedJobId={selectedJob?.id ?? null}
                    onSelectJob={setSelectedJob}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onLoadMore={() => fetchNextPage()}
                  />
                </div>

                {/* Right: Job detail */}
                {selectedJob && !tailorJob && (
                  <div className="flex-1 overflow-y-auto rounded-lg border">
                    <JobDetailPanel
                      job={selectedJob}
                      userSkills={[]}
                      onBack={() => setSelectedJob(null)}
                      onTailorResume={() => setTailorJob(selectedJob)}
                      onFitVectorApply={() => setApplyJob(selectedJob)}
                    />
                  </div>
                )}

                {tailorJob && (
                  <div className="flex-1 overflow-y-auto rounded-lg border">
                    <TailorDialog
                      jobDescription={tailorJob.description}
                      jobTitle={tailorJob.title}
                      companyName={tailorJob.companyName}
                      onClose={() => setTailorJob(null)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* FitVector Apply Modal */}
      {applyJob && (
        <FitVectorApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onSubmitted={() => setApplyJob(null)}
        />
      )}
    </div>
  );
}
