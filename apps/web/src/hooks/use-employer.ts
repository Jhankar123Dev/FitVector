"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type {
  Company,
  CompanyMember,
  CompanyMemberRole,
} from "@fitvector/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployerData {
  company: Company;
  membership: CompanyMember;
}

export interface MemberWithUser extends CompanyMember {
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// ─── Company Queries ──────────────────────────────────────────────────────────

/**
 * Fetch the current user's company and membership.
 * Returns { data: { company, membership } } or throws.
 */
export function useEmployer() {
  return useQuery<{ data: EmployerData }>({
    queryKey: ["employer", "company"],
    queryFn: () => fetchJson("/api/employer/company"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Fetch all members of the current user's company.
 */
export function useCompanyMembers() {
  return useQuery<{ data: MemberWithUser[] }>({
    queryKey: ["employer", "members"],
    queryFn: () => fetchJson("/api/employer/company/members"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ─── Company Mutations ────────────────────────────────────────────────────────

interface CreateCompanyInput {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  industry: string;
  companySize: string;
  description: string;
  cultureKeywords?: string[];
  locations?: { city: string; state?: string; country: string }[];
}

/**
 * Create a new company. Invalidates employer queries and refreshes NextAuth session
 * so the JWT picks up the new role and companyId.
 */
export function useCreateCompany() {
  const qc = useQueryClient();
  const { update: refreshSession } = useSession();

  return useMutation<{ data: { company: Company } }, Error, CreateCompanyInput>(
    {
      mutationFn: (data) =>
        fetchJson("/api/employer/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      onSuccess: async () => {
        qc.invalidateQueries({ queryKey: ["employer"] });
        // Refresh session so JWT gets updated role + companyId
        await refreshSession(undefined);
      },
    }
  );
}

/**
 * Update the current company's profile.
 */
export function useUpdateCompany() {
  const qc = useQueryClient();

  return useMutation<
    { data: { company: Company } },
    Error,
    Partial<CreateCompanyInput>
  >({
    mutationFn: (data) =>
      fetchJson("/api/employer/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "company"] });
    },
  });
}

// ─── Member Mutations ─────────────────────────────────────────────────────────

interface InviteMemberInput {
  email: string;
  role: CompanyMemberRole;
}

/**
 * Invite a new team member by email.
 */
export function useInviteMember() {
  const qc = useQueryClient();

  return useMutation<{ data: CompanyMember }, Error, InviteMemberInput>({
    mutationFn: (data) =>
      fetchJson("/api/employer/company/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "members"] });
    },
  });
}

interface UpdateMemberInput {
  memberId: string;
  role?: CompanyMemberRole;
  status?: "active" | "deactivated";
}

/**
 * Update a team member's role or status.
 */
export function useUpdateMember() {
  const qc = useQueryClient();

  return useMutation<{ data: CompanyMember }, Error, UpdateMemberInput>({
    mutationFn: ({ memberId, ...data }) =>
      fetchJson(`/api/employer/company/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer", "members"] });
    },
  });
}
