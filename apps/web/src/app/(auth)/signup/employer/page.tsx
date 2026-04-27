import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Recruiter Sign Up · FitVector Pro",
  description: "Create your FitVector recruiter account and hire smarter with AI",
};

export default function EmployerSignupPage() {
  return <SignupForm defaultRole="employer" />;
}
