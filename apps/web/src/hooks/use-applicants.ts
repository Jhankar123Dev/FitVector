"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch applicants for a specific job post.
 */
export function useApplicants(jobPostId: string | null, filters?: Record<string, string>) {
  const params = new URLSearchParams(filters || {}).toString();
  const qs = params ? `?${params}` : "";

  return useQuery<{ data: Record<string, unknown>[]; total: number; page: number; limit: number; hasMore: boolean }>({
    queryKey: ["employer", "applicants", jobPostId, filters],
    queryFn: () => fetchJson(`/api/employer/jobs/${jobPostId}/applicants${qs}`),
    enabled: !!jobPostId,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Fetch all applicants across all company job posts.
 */
export function useAllApplicants(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters || {}).toString();
  const qs = params ? `?${params}` : "";

  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "applicants", "all", filters],
    queryFn: () => fetchJson(`/api/employer/applicants${qs}`),
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Fetch a single applicant detail (with notes + votes).
 */
export function useApplicant(id: string | null) {
  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["employer", "applicant", id],
    queryFn: () => fetchJson(`/api/employer/applicants/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Move applicant to a new pipeline stage.
 */
export function useChangeApplicantStage() {
  const qc = useQueryClient();
  return useMutation<
    { data: Record<string, unknown> },
    Error,
    { id: string; stage: string }
  >({
    mutationFn: ({ id, stage }) =>
      fetchJson(`/api/employer/applicants/${id}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
      qc.invalidateQueries({ queryKey: ["employer", "jobs"] });
    },
  });
}

/**
 * Reject an applicant with a reason.
 */
export function useRejectApplicant() {
  const qc = useQueryClient();
  return useMutation<
    { data: Record<string, unknown> },
    Error,
    { id: string; reason: string }
  >({
    mutationFn: ({ id, reason }) =>
      fetchJson(`/api/employer/applicants/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
      qc.invalidateQueries({ queryKey: ["employer", "jobs"] });
    },
  });
}

/**
 * Trigger AI screening for a single applicant.
 */
export function useScreenApplicant() {
  const qc = useQueryClient();
  return useMutation<
    { data: Record<string, unknown> },
    Error,
    string // applicant ID
  >({
    mutationFn: (id) =>
      fetchJson(`/api/employer/applicants/${id}/screen`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
    },
  });
}

/**
 * Bulk screen all unscreened applicants for a job post.
 */
export function useBulkScreen() {
  const qc = useQueryClient();
  return useMutation<
    { data: { screened: number; failed: number; total: number } },
    Error,
    string // job post ID
  >({
    mutationFn: (jobPostId) =>
      fetchJson(`/api/employer/jobs/${jobPostId}/screen-all`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "jobs"] });
    },
  });
}
