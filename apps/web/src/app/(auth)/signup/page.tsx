import { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your FitVector account and start your AI-powered job search",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 py-12">
      <Link href="/" className="mb-8 flex items-center text-2xl font-bold">
        <span className="text-brand-500">Fit</span>
        <span className="text-surface-800">Vector</span>
      </Link>
      <SignupForm />
    </div>
  );
}
