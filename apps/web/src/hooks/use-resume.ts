"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TailorResumeParams, TailorResumeResult, ResumeVersion } from "@/types/resume";

export function useTailorResume() {
  const queryClient = useQueryClient();

  return useMutation<{ data: TailorResumeResult }, Error, TailorResumeParams>({
    mutationFn: async (params) => {
      const res = await fetch("/api/ai/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Tailoring failed" }));
        throw new Error(err.error || "Resume tailoring failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-versions"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
  });
}

export function useResumeVersions() {
  return useQuery<ResumeVersion[]>({
    queryKey: ["resume-versions"],
    queryFn: async () => {
      const res = await fetch("/api/user/resumes");
      if (!res.ok) throw new Error("Failed to load resumes");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 30 * 1000,
  });
}

export function useResumeDetail(id: string | null) {
  return useQuery<{ latexSource: string; pdfUrl: string | null; versionName: string }>({
    queryKey: ["resume-detail", id],
    queryFn: async () => {
      if (!id) throw new Error("No resume ID");
      const res = await fetch(`/api/user/resumes/${id}`);
      if (!res.ok) throw new Error("Failed to load resume");
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}
