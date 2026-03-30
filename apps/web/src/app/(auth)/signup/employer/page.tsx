import { Metadata } from "next";
import Link from "next/link";
import { EmployerSignupForm } from "@/components/auth/employer-signup-form";

export const metadata: Metadata = {
  title: "Recruiter Sign Up",
  description: "Create your FitVector recruiter account",
};

export default function EmployerSignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50">
      <Link href="/" className="mb-8 flex items-center text-2xl font-bold">
        <span className="text-brand-500">Fit</span>
        <span className="text-surface-800">Vector</span>
      </Link>
      <EmployerSignupForm />
    </div>
  );
}
