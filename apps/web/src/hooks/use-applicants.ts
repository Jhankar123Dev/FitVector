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
 * Send an assessment to an applicant (moves them to assessment stage).
 */
export function useSendAssessment() {
  const qc = useQueryClient();
  return useMutation<
    { data: Record<string, unknown> },
    Error,
    string // applicant ID
  >({
    mutationFn: (id) =>
      fetchJson(`/api/employer/applicants/${id}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "assessment_pending" }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
    },
  });
}

/**
 * Schedule a human interview for an applicant (advances stage to human_interview).
 */
export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation<
    { data: Record<string, unknown> },
    Error,
    { applicantId: string; interviewType: string; scheduledAt: string; durationMinutes: number; meetingLink?: string }
  >({
    mutationFn: (body) =>
      fetchJson("/api/employer/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
    },
  });
}

// ─── Assessment submission type returned by the applicant assessments endpoint ─

export interface ApplicantAssessmentSubmission {
  id: string;
  assessmentId: string;
  assessmentName: string;
  assessmentType: string;
  timeLimitMinutes: number | null;
  difficulty: string | null;
  passingScore: number | null;
  totalQuestions: number;
  answeredQuestions: number;
  status: string;
  invitedAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  timeTakenMinutes: number | null;
  autoScore: number | null;
  manualScore: number | null;
  finalScore: number | null;
  passed: boolean | null;
  proctoring: {
    tabSwitches: number;
    copyPasteAttempts: number;
    submittedLate: boolean;
    lateByMinutes: number;
    flagged: boolean;
  };
  plagiarismFlag: boolean;
  graderNotes: string | null;
  createdAt: string;
}

/**
 * Fetch all assessment submissions for a specific applicant (lazy — only called
 * when the employer opens the Assessment tab in the candidate drawer).
 */
export function useApplicantAssessments(applicantId: string | null) {
  return useQuery<{ data: ApplicantAssessmentSubmission[] }>({
    queryKey: ["employer", "applicant", applicantId, "assessments"],
    queryFn: () => fetchJson(`/api/employer/applicants/${applicantId}/assessments`),
    enabled: !!applicantId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/**
 * Assign a specific assessment to an applicant from the candidate detail drawer.
 * Works at any pipeline stage (not just during advance).
 */
export function useAssignAssessmentToApplicant() {
  const qc = useQueryClient();
  return useMutation<
    { data: { assigned: number; tokens: string[] } },
    Error,
    { assessmentId: string; applicantId: string; jobPostId: string }
  >({
    mutationFn: ({ assessmentId, applicantId, jobPostId }) =>
      fetchJson(`/api/employer/assessments/${assessmentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantIds: [applicantId], jobPostId }),
      }),
    onSuccess: (_data, { applicantId }) => {
      qc.invalidateQueries({ queryKey: ["employer", "applicants"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant"] });
      qc.invalidateQueries({ queryKey: ["employer", "applicant", applicantId, "assessments"] });
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
