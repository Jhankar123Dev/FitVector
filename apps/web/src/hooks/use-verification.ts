"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VerificationCategory, VerificationItem } from "@/types/marketplace";

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch the current user's 4 verification items.
 * Always returns all 4 categories; unstarted ones have status "not_started".
 */
export function useVerification() {
  return useQuery<{ data: VerificationItem[] }>({
    queryKey: ["verification"],
    queryFn: () => fetchJson("/api/user/verification"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

interface SubmitVerificationInput {
  category: VerificationCategory;
  file: File;
}

/**
 * Upload a verification document for a given category.
 * On success the verification query is invalidated so the status updates to "pending".
 */
export function useSubmitVerification() {
  const qc = useQueryClient();

  return useMutation<{ data: VerificationItem }, Error, SubmitVerificationInput>({
    mutationFn: async ({ category, file }) => {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("file", file);

      const res = await fetch("/api/user/verification/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verification"] });
    },
  });
}
