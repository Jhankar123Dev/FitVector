"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingFormData } from "@/components/onboarding/wizard";

const STATUS_OPTIONS = [
  { value: "working", label: "Currently Working", icon: "💼" },
  { value: "student", label: "Student", icon: "🎓" },
  { value: "unemployed", label: "Looking for Work", icon: "🔍" },
  { value: "freelancing", label: "Freelancing", icon: "💻" },
] as const;

export function StepStatus() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingFormData>();

  const currentStatus = watch("currentStatus");

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="space-y-3">
        <Label>What describes you best?</Label>
        <div className="grid grid-cols-2 gap-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue("currentStatus", option.value, { shouldValidate: true })}
              className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                currentStatus === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Role */}
      <div className="space-y-2">
        <Label htmlFor="currentRole">
          {currentStatus === "student" ? "Field of Study / Desired Role" : "Current Role"}
        </Label>
        <Input
          id="currentRole"
          placeholder={currentStatus === "student" ? "e.g., Computer Science / Software Engineer" : "e.g., Frontend Developer"}
          {...register("currentRole")}
        />
        {errors.currentRole && (
          <p className="text-xs text-destructive">{errors.currentRole.message}</p>
        )}
      </div>

      {/* Current Company */}
      {(currentStatus === "working" || currentStatus === "freelancing") && (
        <div className="space-y-2">
          <Label htmlFor="currentCompany">
            {currentStatus === "freelancing" ? "Primary Client / Brand Name (optional)" : "Current Company"}
          </Label>
          <Input
            id="currentCompany"
            placeholder={currentStatus === "freelancing" ? "e.g., Self-employed" : "e.g., Acme Corp"}
            {...register("currentCompany")}
          />
        </div>
      )}
    </div>
  );
}
