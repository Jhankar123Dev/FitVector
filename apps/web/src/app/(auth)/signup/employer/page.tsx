import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Recruiter Sign Up · FitVector Pro",
  description: "Create your FitVector recruiter account and hire smarter with AI",
};

export default async function EmployerSignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "employer" ? "/employer" : "/dashboard");
  }
  return <SignupForm defaultRole="employer" />;
}
