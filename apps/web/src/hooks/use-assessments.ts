"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAssessments(type?: string) {
  const params = type && type !== "all" ? `?type=${type}` : "";
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "assessments", type || "all"],
    queryFn: () => fetchJson(`/api/employer/assessments${params}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssessment(id: string | null) {
  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["employer", "assessment", id],
    queryFn: () => fetchJson(`/api/employer/assessments/${id}`),
    enabled: !!id,
  });
}

export function useAssessmentResults(assessmentId: string | null) {
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "assessment-results", assessmentId],
    queryFn: () => fetchJson(`/api/employer/assessments/${assessmentId}/results`),
    enabled: !!assessmentId,
  });
}

export function useSubmission(id: string | null) {
  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["employer", "submission", id],
    queryFn: () => fetchJson(`/api/employer/submissions/${id}`),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJson("/api/employer/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer", "assessments"] }),
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetchJson(`/api/employer/assessments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer", "assessments"] }),
  });
}

export function useAssignAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, ...data }: { assessmentId: string; applicantIds: string[]; jobPostId: string }) =>
      fetchJson(`/api/employer/assessments/${assessmentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "assessment-results"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
    },
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; manualScore: number; graderNotes?: string }) =>
      fetchJson(`/api/employer/submissions/${id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "assessment-results"] });
      qc.invalidateQueries({ queryKey: ["employer", "submission"] });
    },
  });
}
