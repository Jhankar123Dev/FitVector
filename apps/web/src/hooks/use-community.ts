"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// ─── Community Posts ──────────────────────────────────────────────────────────

export function useCommunityPosts(type?: string, category?: string, page?: number) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (category) params.set("category", category);
  if (page) params.set("page", String(page));
  const qs = params.toString() ? `?${params.toString()}` : "";

  return useQuery<{ data: Record<string, unknown>[]; total: number; hasMore: boolean }>({
    queryKey: ["community", "posts", type, category, page],
    queryFn: () => fetchJson(`/api/community/posts${qs}`),
    staleTime: 60 * 1000,
  });
}

export function useCommunityPost(id: string | null) {
  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["community", "post", id],
    queryFn: () => fetchJson(`/api/community/posts/${id}`),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJson("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community", "posts"] }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, ...data }: { postId: string; body: string; isAnonymous?: boolean }) =>
      fetchJson(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community"] }),
  });
}

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetType: "post" | "comment"; targetId: string; voteType: "up" | "down" }) =>
      fetchJson("/api/community/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community", "posts"] }),
  });
}

// ─── Salary ───────────────────────────────────────────────────────────────────

export function useSalaryRoles() {
  return useQuery<{ data: string[] }>({
    queryKey: ["salary", "roles"],
    queryFn: () => fetchJson("/api/salary/roles"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalaryInsights(role: string, location?: string, expMin?: number, expMax?: number) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (location) params.set("location", location);
  if (expMin !== undefined) params.set("expMin", String(expMin));
  if (expMax !== undefined) params.set("expMax", String(expMax));
  const qs = params.toString() ? `?${params.toString()}` : "";

  return useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["salary", "insights", role, location, expMin, expMax],
    queryFn: () => fetchJson(`/api/salary/insights${qs}`),
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitSalaryReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJson("/api/salary/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary"] }),
  });
}
