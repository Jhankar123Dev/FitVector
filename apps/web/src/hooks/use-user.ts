"use client";

import { useSession } from "next-auth/react";
import type { PlanTier } from "@fitvector/shared";

export interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  planTier: PlanTier;
  onboardingCompleted: boolean;
  role: "seeker" | "employer";
  companyId: string | null;
}

export function useUser() {
  const { data: session, status, update } = useSession();

  const user: UserInfo | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        planTier: session.user.planTier ?? "free",
        onboardingCompleted: session.user.onboardingCompleted ?? false,
        role: session.user.role ?? "seeker",
        companyId: session.user.companyId ?? null,
      }
    : null;

  return {
    user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    refreshSession: update,
  };
}
