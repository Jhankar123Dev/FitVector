"use client";

import { useEffect, useRef, useCallback } from "react";
import { JobCard } from "./job-card";
import type { JobSearchResult } from "@/types/job";
import { Loader2 } from "lucide-react";

interface JobListProps {
  jobs: JobSearchResult[];
  selectedJobId: string | null;
  onSelectJob: (job: JobSearchResult) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore: () => void;
}

export function JobList({
  jobs,
  selectedJobId,
  onSelectJob,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: JobListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore();
      }
    },
    [hasNextPage, isFetchingNextPage, onLoadMore],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onClick={onSelectJob}
          isSelected={selectedJobId === job.id}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
