import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password · FitVector Pro",
  description: "Reset your FitVector account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
