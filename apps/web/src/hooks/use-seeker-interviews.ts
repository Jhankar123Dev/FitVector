"use client";

import { useQuery } from "@tanstack/react-query";
import type { SeekerInterview } from "@/app/api/seeker/interviews/route";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function useMyInterviews() {
  return useQuery<{ data: SeekerInterview[] }>({
    queryKey: ["seeker", "interviews"],
    queryFn: () => fetchJson("/api/seeker/interviews"),
    staleTime: 2 * 60 * 1000,      // 2 min — interviews don't change that often
    refetchOnWindowFocus: false,
  });
}
