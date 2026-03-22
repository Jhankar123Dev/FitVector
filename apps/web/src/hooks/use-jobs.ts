"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { JobSearchParams, JobSearchResult } from "@/types/job";

interface JobSearchApiResponse {
  data: {
    jobs: JobSearchResult[];
    total: number;
    page: number;
    limit: number;
    cached: boolean;
    cachedAt: string | null;
    usage?: {
      used: number;
      limit: number;
      period: string;
    };
  };
}

function buildSearchUrl(params: JobSearchParams, page: number): string {
  const sp = new URLSearchParams();
  sp.set("role", params.role);
  if (params.location) sp.set("location", params.location);
  if (params.workMode) sp.set("workMode", params.workMode);
  if (params.jobType) sp.set("jobType", params.jobType);
  if (params.hoursOld) sp.set("hoursOld", String(params.hoursOld));
  if (params.salaryMin) sp.set("salaryMin", String(params.salaryMin));
  if (params.salaryMax) sp.set("salaryMax", String(params.salaryMax));
  if (params.decisionLabel) sp.set("decisionLabel", params.decisionLabel);
  sp.set("page", String(page));
  sp.set("limit", String(params.limit || 25));
  return `/api/jobs/search?${sp.toString()}`;
}

export function useJobSearch(params: JobSearchParams | null) {
  return useInfiniteQuery<JobSearchApiResponse>({
    queryKey: ["jobs", params],
    queryFn: async ({ pageParam }) => {
      if (!params) throw new Error("No search params");
      const url = buildSearchUrl(params, pageParam as number);
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Search failed" }));
        throw new Error(err.error || "Search failed");
      }
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.data;
      if (page * limit < total) {
        return page + 1;
      }
      return undefined;
    },
    enabled: !!params?.role,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useJobDetail(jobId: string | null) {
  return useQuery<{ data: JobSearchResult }>({
    queryKey: ["job-detail", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("No job ID");
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to load job");
      return res.json();
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000,
  });
}
