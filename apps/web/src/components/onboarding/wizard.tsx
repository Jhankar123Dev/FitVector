"use client";

import { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StepStatus } from "@/components/onboarding/step-status";
import { StepRoles } from "@/components/onboarding/step-roles";
import { StepPreferences } from "@/components/onboarding/step-preferences";
import { StepResumeUpload } from "@/components/onboarding/step-resume-upload";
import { Check } from "lucide-react";

const onboardingFullSchema = z.object({
  // Step 1
  currentStatus: z.enum(["student", "working", "unemployed", "freelancing"]),
  currentRole: z.string().min(1, "Current role is required"),
  currentCompany: z.string().optional(),
  // Step 2
  targetRoles: z.array(z.string()).min(1, "Add at least one target role"),
  experienceLevel: z.enum(["fresher", "1_3", "3_7", "7_15", "15_plus"]),
  // Step 3
  targetLocations: z.array(z.string()).min(1, "Add at least one location"),
  preferredWorkMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
  preferredJobTypes: z.array(z.enum(["fulltime", "parttime", "internship", "contract"])).default(["fulltime"]),
  expectedSalaryMin: z.preprocess(v => (typeof v === 'number' && isNaN(v)) ? undefined : v, z.number().optional()),
  expectedSalaryMax: z.preprocess(v => (typeof v === 'number' && isNaN(v)) ? undefined : v, z.number().optional()),
});

export type OnboardingFormData = z.infer<typeof onboardingFullSchema>;

const STEPS = [
  { id: 1, title: "Current Status", description: "Tell us about yourself" },
  { id: 2, title: "Target Roles", description: "What are you looking for?" },
  { id: 3, title: "Preferences", description: "Location & work style" },
  { id: 4, title: "Resume", description: "Upload your resume" },
];

// Step-specific validation schemas
const stepSchemas = [
  z.object({
    currentStatus: z.enum(["student", "working", "unemployed", "freelancing"]),
    currentRole: z.string().min(1, "Current role is required"),
    currentCompany: z.string().optional(),
  }),
  z.object({
    targetRoles: z.array(z.string()).min(1, "Add at least one target role"),
    experienceLevel: z.enum(["fresher", "1_3", "3_7", "7_15", "15_plus"]),
  }),
  z.object({
    targetLocations: z.array(z.string()).min(1, "Add at least one location"),
    preferredWorkMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
    preferredJobTypes: z.array(z.enum(["fulltime", "parttime", "internship", "contract"])),
    expectedSalaryMin: z.preprocess(v => (typeof v === 'number' && isNaN(v)) ? undefined : v, z.number().optional()),
    expectedSalaryMax: z.preprocess(v => (typeof v === 'number' && isNaN(v)) ? undefined : v, z.number().optional()),
  }),
  z.object({}), // Step 4 has no required fields (resume upload is optional)
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFullSchema),
    defaultValues: {
      currentStatus: "working",
      currentRole: "",
      currentCompany: "",
      targetRoles: [],
      experienceLevel: "3_7",
      targetLocations: [],
      preferredWorkMode: "hybrid",
      preferredJobTypes: ["fulltime"],
      expectedSalaryMin: undefined,
      expectedSalaryMax: undefined,
    },
    mode: "onChange",
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const goNext = useCallback(async () => {
    const currentSchema = stepSchemas[currentStep];
    const values = methods.getValues();
    const result = currentSchema.safeParse(values);

    if (!result.success) {
      // Trigger form validation to show errors
      const fieldNames = Object.keys(currentSchema.shape) as Array<keyof OnboardingFormData>;
      for (const field of fieldNames) {
        await methods.trigger(field);
      }
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, methods]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const data = methods.getValues();
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStatus: data.currentStatus,
          currentRole: data.currentRole,
          currentCompany: data.currentCompany,
          experienceLevel: data.experienceLevel,
          targetRoles: data.targetRoles,
          targetLocations: data.targetLocations,
          preferredWorkMode: data.preferredWorkMode,
          preferredJobTypes: data.preferredJobTypes,
          expectedSalaryMin: data.expectedSalaryMin,
          expectedSalaryMax: data.expectedSalaryMax,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save onboarding data");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [methods]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 hidden h-0.5 w-12 sm:block md:w-20 ${
                    index < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="mb-2" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">{STEPS[currentStep].title}</h2>
          <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
        </div>
      </div>

      {/* Form steps */}
      <FormProvider {...methods}>
        <div className="min-h-[400px]">
          {currentStep === 0 && <StepStatus />}
          {currentStep === 1 && <StepRoles />}
          {currentStep === 2 && <StepPreferences />}
          {currentStep === 3 && <StepResumeUpload />}
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          <div className="flex gap-3">
            {currentStep === STEPS.length - 1 ? (
              <>
                <Button type="button" variant="ghost" onClick={handleComplete} disabled={isSubmitting}>
                  Skip for now
                </Button>
                <Button type="button" onClick={handleComplete} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Complete Setup"}
                </Button>
              </>
            ) : (
              <>
                {currentStep >= 2 && (
                  <Button type="button" variant="ghost" onClick={goNext}>
                    Skip
                  </Button>
                )}
                <Button type="button" onClick={goNext}>
                  Continue
                </Button>
              </>
            )}
          </div>
        </div>
      </FormProvider>
    </div>
  );
}
