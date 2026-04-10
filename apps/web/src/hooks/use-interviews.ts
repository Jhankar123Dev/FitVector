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
 * Fetch all AI interviews for the company.
 */
export function useInterviews(status?: string) {
  const params = status && status !== "all" ? `?status=${status}` : "";
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "interviews", status || "all"],
    queryFn: () => fetchJson(`/api/employer/interviews${params}`),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Fetch a single AI interview detail.
 */
export function useInterview(id: string | null) {
  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["employer", "interview", id],
    queryFn: () => fetchJson(`/api/employer/interviews/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch interviews for comparison (up to 3).
 */
export function useInterviewCompare(ids: string[]) {
  const idsStr = ids.join(",");
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "interviews", "compare", idsStr],
    queryFn: () => fetchJson(`/api/employer/interviews/compare?ids=${idsStr}`),
    enabled: ids.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

interface InviteInterviewInput {
  applicantId: string;
  interviewType?: string;
  durationPlanned?: number;
}

/**
 * Send AI interview invite to an applicant.
 */
export function useInviteInterview() {
  const qc = useQueryClient();
  return useMutation<
    { data: Record<string, unknown>; token: string },
    Error,
    InviteInterviewInput
  >({
    mutationFn: ({ applicantId, ...data }) =>
      fetchJson(`/api/employer/applicants/${applicantId}/invite-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "interviews"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
    },
  });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      applicantId:   string;
      jobPostId:     string;
      interviewerId: string;
      scheduledAt:   string;
      durationMins:  number;
      format:        "video" | "phone" | "in_person";
      meetingLink?:  string;
      notes?:        string;
    }) =>
      fetchJson("/api/employer/interviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "interviews"] });
    },
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      fetchJson(`/api/employer/interviews/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer", "interviews"] }),
  });
}
