"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { OnboardingFormData } from "@/components/onboarding/wizard";

const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher (0-1 years)" },
  { value: "1_3", label: "Junior (1-3 years)" },
  { value: "3_7", label: "Mid-Level (3-7 years)" },
  { value: "7_15", label: "Senior (7-15 years)" },
  { value: "15_plus", label: "Staff+ (15+ years)" },
] as const;

const SUGGESTED_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "Data Scientist",
  "Product Manager",
  "DevOps Engineer",
  "Mobile Developer",
  "ML Engineer",
  "QA Engineer",
  "UI/UX Designer",
  "Data Analyst",
];

export function StepRoles() {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext<OnboardingFormData>();

  const targetRoles = watch("targetRoles") || [];
  const [roleInput, setRoleInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = SUGGESTED_ROLES.filter(
    (role) =>
      role.toLowerCase().includes(roleInput.toLowerCase()) && !targetRoles.includes(role),
  );

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (trimmed && !targetRoles.includes(trimmed)) {
      setValue("targetRoles", [...targetRoles, trimmed], { shouldValidate: true });
    }
    setRoleInput("");
    setShowSuggestions(false);
  };

  const removeRole = (role: string) => {
    setValue(
      "targetRoles",
      targetRoles.filter((r) => r !== role),
      { shouldValidate: true },
    );
  };

  return (
    <div className="space-y-6">
      {/* Target Roles */}
      <div className="space-y-3">
        <Label>What roles are you targeting?</Label>
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={roleInput}
              onChange={(e) => {
                setRoleInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (roleInput.trim()) addRole(roleInput);
                }
              }}
              placeholder="Type a role and press Enter..."
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => roleInput.trim() && addRole(roleInput)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Autocomplete suggestions */}
          {showSuggestions && roleInput && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
              {filteredSuggestions.slice(0, 5).map((role) => (
                <button
                  key={role}
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => addRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected roles */}
        {targetRoles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {targetRoles.map((role) => (
              <Badge key={role} variant="secondary" className="gap-1 py-1">
                {role}
                <button type="button" onClick={() => removeRole(role)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {errors.targetRoles && (
          <p className="text-xs text-destructive">{errors.targetRoles.message}</p>
        )}

        {/* Quick suggestions */}
        {targetRoles.length === 0 && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_ROLES.slice(0, 6).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => addRole(role)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <Label htmlFor="experienceLevel">Experience Level</Label>
        <Select id="experienceLevel" {...register("experienceLevel")}>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
