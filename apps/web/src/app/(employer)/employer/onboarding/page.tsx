"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCompany, useInviteMember } from "@/hooks/use-employer";
import type { OnboardingData, TeamMemberRole } from "@/types/employer";
import { Step1CompanyBasics } from "./_components/step-1-company-basics";
import { Step2CompanyProfile } from "./_components/step-2-company-profile";
import { Step3TeamSetup } from "./_components/step-3-team-setup";
import { Step4FirstJob } from "./_components/step-4-first-job";

const STEPS = [
  { id: 1, label: "Company Basics" },
  { id: 2, label: "Company Profile" },
  { id: 3, label: "Team Setup" },
  { id: 4, label: "First Job" },
];

const INITIAL_DATA: OnboardingData = {
  companyName: "",
  logoFile: null,
  logoPreviewUrl: null,
  websiteUrl: "",
  industry: "",
  companySize: "",
  description: "",
  cultureKeywords: [],
  locations: [],
  invites: [],
};

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createCompany = useCreateCompany();
  const inviteMember = useInviteMember();

  const [keywordInput, setKeywordInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMemberRole>("recruiter");
  const [aiLoading, setAiLoading] = useState(false);

  const progress = (step / STEPS.length) * 100;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateData({ logoFile: file, logoPreviewUrl: URL.createObjectURL(file) });
  }

  function addKeyword() {
    const kw = keywordInput.trim();
    if (kw && !data.cultureKeywords.includes(kw)) {
      updateData({ cultureKeywords: [...data.cultureKeywords, kw] });
    }
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    updateData({ cultureKeywords: data.cultureKeywords.filter((k) => k !== kw) });
  }

  function addLocation() {
    const loc = locationInput.trim();
    if (loc && !data.locations.includes(loc)) {
      updateData({ locations: [...data.locations, loc] });
    }
    setLocationInput("");
  }

  function removeLocation(loc: string) {
    updateData({ locations: data.locations.filter((l) => l !== loc) });
  }

  function addInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || data.invites.some((i) => i.email === email)) return;
    updateData({ invites: [...data.invites, { email, role: inviteRole }] });
    setInviteEmail("");
    setInviteRole("recruiter");
  }

  function removeInvite(email: string) {
    updateData({ invites: data.invites.filter((i) => i.email !== email) });
  }

  function handleAiAssist() {
    if (!data.websiteUrl) return;
    setAiLoading(true);
    setTimeout(() => {
      updateData({
        description:
          "We're a fast-growing SaaS company building AI-powered developer tools. Our mission is to empower engineering teams to ship high-quality software 10x faster. With a culture rooted in ownership, transparency, and continuous learning, we believe the best products come from empowered teams that move quickly and care deeply about their craft.",
      });
      setAiLoading(false);
    }, 1500);
  }

  function handleNext() {
    if (step < STEPS.length) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  async function handleComplete() {
    setSubmitError(null);
    try {
      const parsedLocations = data.locations.map((loc) => {
        const parts = loc.split(",").map((s) => s.trim());
        return {
          city: parts[0] || loc,
          state: parts.length > 2 ? parts[1] : undefined,
          country: parts[parts.length - 1] || "India",
        };
      });

      await createCompany.mutateAsync({
        name: data.companyName,
        logoUrl: data.logoPreviewUrl || null,
        websiteUrl: data.websiteUrl || null,
        industry: data.industry,
        companySize: data.companySize,
        description: data.description,
        cultureKeywords: data.cultureKeywords,
        locations: parsedLocations,
      });

      for (const invite of data.invites) {
        try {
          await inviteMember.mutateAsync({ email: invite.email, role: invite.role });
        } catch (err) {
          console.warn(`Failed to invite ${invite.email}:`, err);
        }
      }

      router.push("/employer");
    } catch (err) {
      console.error("Company creation failed:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create company. Please try again.",
      );
    }
  }

  const canProceed =
    step === 1
      ? data.companyName.length >= 2 && data.industry !== "" && data.companySize !== ""
      : step === 2
        ? data.description.length >= 10
        : true;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-surface-800">
          Set up your company
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Complete these steps to start hiring with FitVector
        </p>
      </div>

      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((s) => (
            <button
              key={s.id}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                s.id === step
                  ? "text-brand-600"
                  : s.id < step
                    ? "text-accent-600"
                    : "text-surface-400",
              )}
              onClick={() => s.id < step && setStep(s.id)}
              disabled={s.id > step}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                  s.id === step
                    ? "bg-brand-500 text-white"
                    : s.id < step
                      ? "bg-accent-500 text-white"
                      : "bg-surface-200 text-surface-500",
                )}
              >
                {s.id < step ? <Check className="h-3.5 w-3.5" /> : s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {step === 1 && (
        <Step1CompanyBasics data={data} updateData={updateData} onLogoUpload={handleLogoUpload} />
      )}
      {step === 2 && (
        <Step2CompanyProfile
          data={data}
          updateData={updateData}
          keywordInput={keywordInput}
          setKeywordInput={setKeywordInput}
          locationInput={locationInput}
          setLocationInput={setLocationInput}
          addKeyword={addKeyword}
          removeKeyword={removeKeyword}
          addLocation={addLocation}
          removeLocation={removeLocation}
          aiLoading={aiLoading}
          onAiAssist={handleAiAssist}
        />
      )}
      {step === 3 && (
        <Step3TeamSetup
          data={data}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          addInvite={addInvite}
          removeInvite={removeInvite}
        />
      )}
      {step === 4 && (
        <Step4FirstJob
          submitError={submitError}
          isPending={createCompany.isPending}
          onComplete={handleComplete}
        />
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 1} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {step < 4 && (
          <Button onClick={handleNext} disabled={!canProceed} className="gap-1.5">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
