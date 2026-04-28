import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In · FitVector Pro",
  description: "Sign in to your FitVector account",
};

export default async function LoginPage() {
  // Server-side session check — already logged-in users never see the login form
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "employer" ? "/employer/dashboard" : "/dashboard");
  }
  return <LoginForm />;
}
