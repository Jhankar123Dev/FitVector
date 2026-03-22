"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import type { OnboardingFormData } from "@/components/onboarding/wizard";

const WORK_MODES = [
  { value: "remote", label: "Remote", icon: "🏠" },
  { value: "hybrid", label: "Hybrid", icon: "🔄" },
  { value: "onsite", label: "On-site", icon: "🏢" },
] as const;

const JOB_TYPES = [
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
] as const;

const SUGGESTED_LOCATIONS = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Remote",
  "Kolkata",
  "Ahmedabad",
  "Noida",
];

export function StepPreferences() {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext<OnboardingFormData>();

  const targetLocations = watch("targetLocations") || [];
  const preferredWorkMode = watch("preferredWorkMode");
  const preferredJobTypes = watch("preferredJobTypes") || [];
  const [locationInput, setLocationInput] = useState("");

  const filteredLocations = SUGGESTED_LOCATIONS.filter(
    (loc) =>
      loc.toLowerCase().includes(locationInput.toLowerCase()) && !targetLocations.includes(loc),
  );

  const addLocation = (location: string) => {
    const trimmed = location.trim();
    if (trimmed && !targetLocations.includes(trimmed)) {
      setValue("targetLocations", [...targetLocations, trimmed], { shouldValidate: true });
    }
    setLocationInput("");
  };

  const removeLocation = (location: string) => {
    setValue(
      "targetLocations",
      targetLocations.filter((l) => l !== location),
      { shouldValidate: true },
    );
  };

  const toggleJobType = (type: "fulltime" | "parttime" | "internship" | "contract") => {
    const current = preferredJobTypes || [];
    if (current.includes(type)) {
      setValue("preferredJobTypes", current.filter((t) => t !== type));
    } else {
      setValue("preferredJobTypes", [...current, type]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Locations */}
      <div className="space-y-3">
        <Label>Target Locations</Label>
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (locationInput.trim()) addLocation(locationInput);
                }
              }}
              placeholder="Type a city and press Enter..."
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => locationInput.trim() && addLocation(locationInput)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {locationInput && filteredLocations.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
              {filteredLocations.slice(0, 5).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => addLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {targetLocations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {targetLocations.map((loc) => (
              <Badge key={loc} variant="secondary" className="gap-1 py-1">
                {loc}
                <button type="button" onClick={() => removeLocation(loc)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {errors.targetLocations && (
          <p className="text-xs text-destructive">{errors.targetLocations.message}</p>
        )}

        {targetLocations.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_LOCATIONS.slice(0, 6).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => addLocation(loc)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                + {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Work Mode */}
      <div className="space-y-3">
        <Label>Preferred Work Mode</Label>
        <div className="grid grid-cols-3 gap-3">
          {WORK_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setValue("preferredWorkMode", mode.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-colors ${
                preferredWorkMode === mode.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="text-xl">{mode.icon}</span>
              <span className="text-xs font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Job Types */}
      <div className="space-y-3">
        <Label>Job Types</Label>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleJobType(type.value)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                preferredJobTypes.includes(type.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Salary Range (Optional) */}
      <div className="space-y-3">
        <Label>Expected Salary Range (Optional)</Label>
        <p className="text-xs text-muted-foreground">Annual salary in INR</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              type="number"
              placeholder="Min (e.g., 1000000)"
              {...register("expectedSalaryMin", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max (e.g., 2500000)"
              {...register("expectedSalaryMax", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
