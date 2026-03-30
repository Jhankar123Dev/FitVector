"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InterviewPanel {
  id: string;
  company_id: string;
  name: string;
  interview_type: string;
  default_interviewer_ids: string[];
  round_number: number;
  duration_minutes: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePanelInput {
  name: string;
  interviewType: string;
  defaultInterviewerIds?: string[];
  roundNumber: number;
  durationMinutes?: number;
  description?: string;
}

export interface UpdatePanelInput {
  id: string;
  name?: string;
  interviewType?: string;
  defaultInterviewerIds?: string[];
  roundNumber?: number;
  durationMinutes?: number;
  description?: string;
}

// ─── Fetch helper ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// ─── Query key ───────────────────────────────────────────────────────────────

const PANELS_KEY = ["employer", "interview-panels"] as const;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all active interview panels for the company.
 */
export function useInterviewPanels() {
  return useQuery<{ data: InterviewPanel[] }>({
    queryKey: [...PANELS_KEY],
    queryFn: () => fetchJson("/api/employer/interviews/panels"),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create a new interview panel.
 */
export function useCreatePanel() {
  const qc = useQueryClient();
  return useMutation<{ data: InterviewPanel }, Error, CreatePanelInput>({
    mutationFn: (input) =>
      fetchJson("/api/employer/interviews/panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...PANELS_KEY] });
    },
  });
}

/**
 * Update an existing interview panel.
 */
export function useUpdatePanel() {
  const qc = useQueryClient();
  return useMutation<{ data: InterviewPanel }, Error, UpdatePanelInput>({
    mutationFn: ({ id, ...data }) =>
      fetchJson(`/api/employer/interviews/panels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...PANELS_KEY] });
    },
  });
}

/**
 * Soft-delete an interview panel.
 */
export function useDeletePanel() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      fetchJson(`/api/employer/interviews/panels/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...PANELS_KEY] });
    },
  });
}
