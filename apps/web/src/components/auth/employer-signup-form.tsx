"use client";

/**
 * @deprecated Use <SignupForm defaultRole="employer" /> instead.
 * This file is kept for backwards-compatibility with any remaining consumers.
 * It will be removed in a cleanup PR after Phase 4 migration is complete.
 */
import { SignupForm } from "@/components/auth/signup-form";

export function EmployerSignupForm() {
  return <SignupForm defaultRole="employer" />;
}
