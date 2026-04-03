"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface TrackerApplication {
  id: string;
  jobId: string | null;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string | null;
  jobUrl: string | null;
  /** Local tracker status (drag-drop writable) */
  status: string;
  /**
   * Live status from fitvector_applications — present only for FitVector
   * applications. When non-null this is the source of truth for column
   * placement; `status` is ignored for column routing.
   *
   * Values: "applied" | "under_review" | "interview_invited" |
   *         "interviewed" | "decision_pending" | "offered" |
   *         "rejected" | "withdrawn"
   */
  fitvectorStatus: string | null;
  statusHistory: Array<{ status: string; changed_at: string }>;
  notes: string | null;
  nextFollowupDate: string | null;
  positionOrder: number;
  contactName: string | null;
  contactEmail: string | null;
  contactRole: string | null;
  tailoredResumeId: string | null;
  appliedAt: string | null;
  createdAt: string;
}

export function useTrackerApplications(search?: string) {
  return useQuery<TrackerApplication[]>({
    queryKey: ["tracker", search],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (search) sp.set("search", search);
      const res = await fetch(`/api/tracker?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to load tracker");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      jobTitle: string;
      companyName: string;
      jobId?: string;
      jobUrl?: string;
      location?: string;
      status?: string;
    }) => {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to create application");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracker"] }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      notes?: string;
      positionOrder?: number;
      nextFollowupDate?: string;
      contactName?: string;
      contactEmail?: string;
      contactRole?: string;
    }) => {
      const res = await fetch(`/api/tracker/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracker"] }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tracker/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracker"] }),
  });
}
