import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up · FitVector Pro",
  description: "Create your FitVector account and start your AI-powered job search",
};

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "employer" ? "/employer/dashboard" : "/dashboard");
  }
  return <SignupForm defaultRole="seeker" />;
}
