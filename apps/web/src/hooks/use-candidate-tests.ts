"use client";

import { useQuery } from "@tanstack/react-query";

export interface CandidateTest {
  id: string;
  assessmentName: string;
  assessmentType: string;
  jobTitle: string;
  status: "invited" | "started" | "submitted" | "graded" | "expired";
  finalScore: number | null;
  autoScore: number | null;
  passingScore: number | null;
  timeLimit: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
}

async function fetchCandidateTests(): Promise<CandidateTest[]> {
  const res = await fetch("/api/user/tests");
  if (!res.ok) throw new Error("Failed to fetch tests");
  const json = await res.json();
  return json.data ?? [];
}

export function useCandidateTests() {
  return useQuery<CandidateTest[]>({
    queryKey: ["candidate-tests"],
    queryFn: fetchCandidateTests,
    staleTime: 30 * 1000,
  });
}
