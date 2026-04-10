"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WorkHistoryEntry {
  company:      string;
  title:        string;
  startDate:    string;
  endDate:      string | null;
  isCurrent:    boolean;
  description?: string;
}

export interface SeekerProfile {
  fullName:          string | null;
  email:             string | null;
  currentRole:       string | null;
  currentCompany:    string | null;
  experienceLevel:   string | null;
  targetRoles:       string[];
  targetLocations:   string[];
  preferredWorkMode: string | null;
  preferredJobTypes: string[];
  skills:            string[];
  phone:             string | null;
  linkedinUrl:       string | null;
  portfolioUrl:      string | null;
  workHistory:       WorkHistoryEntry[];
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function useSeekerProfile() {
  return useQuery<{ data: SeekerProfile }>({
    queryKey:  ["seeker", "profile"],
    queryFn:   () => fetchJson("/api/seeker/profile"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSeekerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SeekerProfile> & { workHistory?: WorkHistoryEntry[] }) =>
      fetchJson("/api/seeker/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seeker", "profile"] }),
  });
}
