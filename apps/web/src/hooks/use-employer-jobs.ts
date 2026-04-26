"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { JobPost } from "@/types/employer";

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) {
    const fieldErrors = json.details?.fieldErrors as Record<string, string[]> | undefined;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const msg = Object.entries(fieldErrors)
        .map(([field, errs]) => `${field}: ${errs[0]}`)
        .join(" · ");
      throw new Error(msg);
    }
    throw new Error(json.error || "Request failed");
  }
  return json;
}

// ─── Extended JobPost with computed counts ────────────────────────────────────

export interface JobPostWithCounts extends JobPost {
  screenedCount: number;
  interviewedCount: number;
  hiredCount: number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all job posts for the current company.
 */
export function useEmployerJobs(status?: string) {
  const params = status && status !== "all" ? `?status=${status}` : "";
  return useQuery<{ data: JobPostWithCounts[] }>({
    queryKey: ["employer", "jobs", status || "all"],
    queryFn: () => fetchJson(`/api/employer/jobs${params}`),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Fetch a single job post by ID.
 */
export function useEmployerJob(id: string | null) {
  return useQuery<{ data: JobPost }>({
    queryKey: ["employer", "jobs", id],
    queryFn: () => fetchJson(`/api/employer/jobs/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new job post.
 */
export function useCreateJobPost() {
  const qc = useQueryClient();
  return useMutation<{ data: JobPost }, Error, Partial<JobPost> & { title: string; description: string }>({
    mutationFn: (data) =>
      fetchJson("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "jobs"] });
      qc.invalidateQueries({ queryKey: ["companies-search"] });
    },
  });
}

/**
 * Update an existing job post.
 */
export function useUpdateJobPost() {
  const qc = useQueryClient();
  return useMutation<{ data: JobPost }, Error, { id: string } & Record<string, unknown>>({
    mutationFn: ({ id, ...data }) =>
      fetchJson(`/api/employer/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "jobs"] });
      qc.invalidateQueries({ queryKey: ["companies-search"] });
    },
  });
}

/**
 * Change job post status (publish/pause/close/fill).
 */
export function useChangeJobStatus() {
  const qc = useQueryClient();
  return useMutation<{ data: JobPost }, Error, { id: string; status: string }>({
    mutationFn: ({ id, status }) =>
      fetchJson(`/api/employer/jobs/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      // Invalidate employer-side job list
      qc.invalidateQueries({ queryKey: ["employer", "jobs"] });
      // Also bust the seeker-facing companies search cache so the
      // active-job badge updates immediately in the same session.
      qc.invalidateQueries({ queryKey: ["companies-search"] });
    },
  });
}

/**
 * Duplicate a job post.
 */
export function useDuplicateJobPost() {
  const qc = useQueryClient();
  return useMutation<{ data: JobPost }, Error, string>({
    mutationFn: (id) =>
      fetchJson(`/api/employer/jobs/${id}/duplicate`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "jobs"] });
    },
  });
}
