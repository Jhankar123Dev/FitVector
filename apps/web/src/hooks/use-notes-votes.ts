"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function useApplicantNotes(applicantId: string | null) {
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "applicant-notes", applicantId],
    queryFn: () => fetchJson(`/api/employer/applicants/${applicantId}/notes`),
    enabled: !!applicantId,
    staleTime: 30 * 1000,
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, ...data }: { applicantId: string; body: string; mentions?: string[] }) =>
      fetchJson(`/api/employer/applicants/${applicantId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicant-notes"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
    },
  });
}

// ─── Votes ────────────────────────────────────────────────────────────────────

export function useApplicantVotes(applicantId: string | null) {
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "applicant-votes", applicantId],
    queryFn: () => fetchJson(`/api/employer/applicants/${applicantId}/vote`),
    enabled: !!applicantId,
    staleTime: 30 * 1000,
  });
}

export function useCastVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, vote }: { applicantId: string; vote: string }) =>
      fetchJson(`/api/employer/applicants/${applicantId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicant-votes"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
    },
  });
}
