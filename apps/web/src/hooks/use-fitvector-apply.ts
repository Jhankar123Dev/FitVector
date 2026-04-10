"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

/**
 * Apply to a job via FitVector one-click.
 */
export function useFitVectorApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      jobPostId: string;
      resumeId?: string;
      resumeName?: string;
      matchScore?: number;
      screeningAnswers?: Array<{ questionId: string; question: string; answer: string }>;
      coverNote?: string;
    }) => {
      const { jobPostId, ...body } = data;
      return fetchJson(`/api/apply/fitvector/${jobPostId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitvector", "applications"] });
      qc.invalidateQueries({ queryKey: ["tracker"] });
    },
  });
}

/**
 * List my FitVector applications (seeker side).
 */
export function useFitVectorApplications() {
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["fitvector", "applications"],
    queryFn: () => fetchJson("/api/applications/fitvector"),
    staleTime: 60 * 1000,
  });
}

/**
 * Get real-time status for a specific FitVector application.
 */
export function useFitVectorStatus(id: string | null) {
  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["fitvector", "status", id],
    queryFn: () => fetchJson(`/api/applications/fitvector/${id}/status`),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30s for real-time updates
  });
}

export interface FVApplicationDetail {
  id: string;
  status: string;
  statusTimeline: Array<{ status: string; label: string; timestamp: string }>;
  statusUpdatedAt: string | null;
  isBoosted: boolean;
  boostTier: string | null;
  resumeName: string | null;
  matchScore: number | null;
  screeningAnswers: Array<{ questionId: string; question: string; answer: string }>;
  coverNote: string | null;
  appliedAt: string;
}

/**
 * Full detail for a FitVector application (timeline + submission data).
 * Used by ApplicationDetailModal to replace mock data.
 */
export function useFitVectorDetail(id: string | null) {
  return useQuery<{ data: FVApplicationDetail }>({
    queryKey: ["fitvector", "detail", id],
    queryFn: () => fetchJson(`/api/applications/fitvector/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
