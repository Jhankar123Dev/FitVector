"use client";

import { useQuery } from "@tanstack/react-query";
import type { UsageData } from "@/types/job";

export function useUsage() {
  return useQuery<UsageData>({
    queryKey: ["usage"],
    queryFn: async () => {
      const res = await fetch("/api/usage");
      if (!res.ok) throw new Error("Failed to load usage");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}
