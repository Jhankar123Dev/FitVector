import { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Set up your FitVector profile to get personalized job matches",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
      <div className="w-full border-b px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <svg
            className="h-7 w-7 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-lg font-bold">FitVector</span>
        </div>
      </div>
      <OnboardingWizard />
    </div>
  );
}
