"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function useScheduledInterviews() {
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "scheduling"],
    queryFn: () => fetchJson("/api/employer/scheduling"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, ...data }: { applicantId: string } & Record<string, unknown>) =>
      fetchJson(`/api/employer/applicants/${applicantId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "scheduling"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
    },
  });
}

export function useRescheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetchJson(`/api/employer/scheduling/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer", "scheduling"] }),
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; rating: string; feedback?: unknown; notes?: string }) =>
      fetchJson(`/api/employer/scheduling/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer", "scheduling"] }),
  });
}
