"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function useAnalytics(range?: string) {
  const params = range ? `?range=${range}` : "";
  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["employer", "analytics", range || "30d"],
    queryFn: () => fetchJson(`/api/employer/analytics${params}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFunnel() {
  return useQuery<{ data: Array<{ stage: string; count: number; conversionRate: number | null }> }>({
    queryKey: ["employer", "analytics", "funnel"],
    queryFn: () => fetchJson("/api/employer/analytics/funnel"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSources() {
  return useQuery<{ data: Array<{ source: string; count: number; avgScore: number }> }>({
    queryKey: ["employer", "analytics", "sources"],
    queryFn: () => fetchJson("/api/employer/analytics/sources"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useJobPerformance() {
  return useQuery<{ data: Array<{ jobId: string; title: string; applicants: number; screenRate: number; interviewRate: number; hired: number }> }>({
    queryKey: ["employer", "analytics", "jobs"],
    queryFn: () => fetchJson("/api/employer/analytics/jobs"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrend() {
  return useQuery<{ data: Array<{ week: string; days: number }> }>({
    queryKey: ["employer", "analytics", "trend"],
    queryFn: () => fetchJson("/api/employer/analytics/trend"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInterviewerPerformance() {
  return useQuery<{ data: Array<{ memberId: string; name: string; interviewsDone: number; avgFeedbackTime: number | null; avgScore: number | null }> }>({
    queryKey: ["employer", "analytics", "interviewers"],
    queryFn: () => fetchJson("/api/employer/analytics/interviewers"),
    staleTime: 5 * 60 * 1000,
  });
}
