"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, SearchX, Loader2 } from "lucide-react";
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
import { useJobSearch } from "@/hooks/use-jobs";
import { useUser } from "@/hooks/use-user";
import type { JobSearchParams, JobSearchResult } from "@/types/job";

const DEFAULT_FILTERS: JobFilters = {
  location: "",
  workMode: "",
  jobType: "",
  hoursOld: 72,
  salaryMin: "",
  salaryMax: "",
  decisionLabel: "",
};

export default function JobsPage() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [searchParams, setSearchParams] = useState<JobSearchParams | null>(null);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [selectedJob, setSelectedJob] = useState<JobSearchResult | null>(null);
  const [tailorJob, setTailorJob] = useState<JobSearchResult | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    isError,
  } = useJobSearch(searchParams);

  const allJobs = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data.jobs);
  }, [data]);

  const totalJobs = data?.pages?.[0]?.data.total ?? 0;
  const usage = data?.pages?.[0]?.data.usage;

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setSelectedJob(null);
    setSearchParams({
      role: query.trim(),
      location: filters.location || undefined,
      workMode: (filters.workMode || undefined) as JobSearchParams["workMode"],
      jobType: (filters.jobType || undefined) as JobSearchParams["jobType"],
      hoursOld: filters.hoursOld,
      salaryMin: filters.salaryMin ? Number(filters.salaryMin) : undefined,
      salaryMax: filters.salaryMax ? Number(filters.salaryMax) : undefined,
      decisionLabel: filters.decisionLabel || undefined,
    });
  }, [query, filters]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Re-trigger search when decision label filter changes (if already searched)
  const handleFiltersChange = useCallback(
    (newFilters: JobFilters) => {
      setFilters(newFilters);
      // If decision label changed and we already have search params, re-search
      if (
        searchParams &&
        newFilters.decisionLabel !== filters.decisionLabel
      ) {
        setSelectedJob(null);
        setSearchParams({
          ...searchParams,
          decisionLabel: newFilters.decisionLabel || undefined,
        });
      }
    },
    [searchParams, filters.decisionLabel],
  );

  const isLimitReached = isError && (error as Error)?.message?.includes("limit");

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Job Search</h1>
            <p className="text-sm text-muted-foreground">
              Search across multiple platforms and find your perfect match
            </p>
          </div>

          {/* Usage counter */}
          {usage && usage.limit !== Infinity && (
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <span className="font-medium">
                {usage.used} of {usage.limit}
              </span>{" "}
              searches used today
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs... e.g. Frontend Developer, Data Scientist"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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

        {/* Filters */}
        <JobFiltersPanel
          filters={filters}
          onChange={handleFiltersChange}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            if (searchParams) {
              setSearchParams({ ...searchParams, decisionLabel: undefined });
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
        <LoadingSpinner message="Searching across job platforms..." />
      )}

      {/* No search yet */}
      {!searchParams && !isLoading && (
        <EmptyState
          icon={Search}
          title="Start your job search"
          description="Enter a role above and we'll search across LinkedIn, Indeed, Naukri, Glassdoor and more."
        />
      )}

      {/* Results */}
      {searchParams && !isLoading && !isError && (
        <>
          {allJobs.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No jobs found"
              description="Try broadening your search terms or adjusting filters."
            />
          ) : (
            <>
              {/* Results count */}
              <div className="mb-3 text-xs text-muted-foreground">
                {totalJobs} job{totalJobs !== 1 ? "s" : ""} found
              </div>

              {/* Split layout: list + detail */}
              <div className="flex min-h-0 flex-1 gap-4">
                {/* Left: Job list */}
                <div
                  className={`min-h-0 overflow-y-auto ${
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
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
                    <JobDetailPanel
                      job={selectedJob}
                      userSkills={[]}
                      onBack={() => setSelectedJob(null)}
                      onTailorResume={() => setTailorJob(selectedJob)}
                    />
                  </div>
                )}

                {tailorJob && (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
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
    </div>
  );
}
