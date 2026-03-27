import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your FitVector account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50">
      <Link href="/" className="mb-8 flex items-center text-2xl font-bold">
        <span className="text-brand-500">Fit</span>
        <span className="text-surface-800">Vector</span>
      </Link>
      <LoginForm />
    </div>
  );
}
