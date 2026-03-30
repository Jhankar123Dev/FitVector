"use client";

import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  activeApplications: number;
  jobMatches: number;
  resumesCreated: number;
  messagesSent: number;
}

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/user/dashboard-stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  const json = await res.json();
  return json.data;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    staleTime: 60 * 1000, // 1 minute
  });
}
