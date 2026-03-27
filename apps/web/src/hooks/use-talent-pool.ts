"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function useTalentPool(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters || {}).toString();
  const qs = params ? `?${params}` : "";
  return useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["employer", "talent-pool", filters],
    queryFn: () => fetchJson(`/api/employer/talent-pool${qs}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      fetchJson(`/api/employer/talent-pool/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer", "talent-pool"] }),
  });
}

export function useReengage() {
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/employer/talent-pool/${id}/reengage`, { method: "POST" }),
  });
}
