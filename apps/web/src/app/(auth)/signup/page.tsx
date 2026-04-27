import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up · FitVector Pro",
  description: "Create your FitVector account and start your AI-powered job search",
};

export default function SignupPage() {
  return <SignupForm defaultRole="seeker" />;
}
