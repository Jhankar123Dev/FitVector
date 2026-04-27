import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In · FitVector Pro",
  description: "Sign in to your FitVector account",
};

export default function LoginPage() {
  return <LoginForm />;
}
