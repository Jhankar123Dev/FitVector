"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { DecisionLabel } from "@/types/job";

export interface JobFilters {
  location: string;
  workMode: "onsite" | "remote" | "hybrid" | "";
  jobType: "fulltime" | "parttime" | "internship" | "contract" | "";
  hoursOld: number;
  salaryMin: string;
  salaryMax: string;
  decisionLabel: DecisionLabel | "";
}

interface JobFiltersProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  onReset: () => void;
  hideHoursOld?: boolean;
}

const WORK_MODES = [
  { value: "", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

const JOB_TYPES = [
  { value: "", label: "All" },
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
] as const;

const DATE_OPTIONS = [
  { value: 24, label: "24h" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
  { value: 720, label: "30 days" },
] as const;

const DECISION_LABELS = [
  { value: "", label: "All jobs" },
  { value: "apply_now", label: "Apply now", color: "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" },
  { value: "prepare_then_apply", label: "Prepare & apply", color: "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" },
  { value: "explore", label: "Explore", color: "border-border bg-muted text-muted-foreground" },
] as const;

export function JobFiltersPanel({ filters, onChange, onReset, hideHoursOld = false }: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);

  const hasFilters =
    filters.location ||
    filters.workMode ||
    filters.jobType ||
    filters.hoursOld !== 720 ||
    filters.salaryMin ||
    filters.salaryMax ||
    filters.decisionLabel;

  return (
    <div>
      {/* Toggle button + decision label quick filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasFilters && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-white">
              !
            </span>
          )}
        </Button>

        {/* Decision label quick filters */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {DECISION_LABELS.map((dl) => (
            <button
              key={dl.value}
              className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                filters.decisionLabel === dl.value
                  ? dl.value
                    ? dl.color
                    : "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border/60"
              }`}
              onClick={() =>
                onChange({
                  ...filters,
                  decisionLabel: dl.value as JobFilters["decisionLabel"],
                })
              }
            >
              {dl.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-xs">
            <X className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {isOpen && (
        <div className="mt-3 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Location */}
          <div>
            <Label className="text-xs">Location</Label>
            <Input
              placeholder="e.g. Bangalore, Remote"
              value={filters.location}
              onChange={(e) =>
                onChange({ ...filters, location: e.target.value })
              }
              className="mt-1 h-8 text-sm"
            />
          </div>

          {/* Work Mode */}
          <div>
            <Label htmlFor="work-mode" className="text-xs">Work Mode</Label>
            <select
              id="work-mode"
              value={filters.workMode}
              onChange={(e) =>
                onChange({ ...filters, workMode: e.target.value as JobFilters["workMode"] })
              }
              className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {WORK_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div>
            <Label htmlFor="job-type" className="text-xs">Job Type</Label>
            <select
              id="job-type"
              value={filters.jobType}
              onChange={(e) =>
                onChange({ ...filters, jobType: e.target.value as JobFilters["jobType"] })
              }
              className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {JOB_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Date Posted — hidden for FitVector tab */}
          {!hideHoursOld && (
            <div>
              <Label className="text-xs">Date Posted</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors ${
                      filters.hoursOld === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-border/60"
                    }`}
                    onClick={() =>
                      onChange({ ...filters, hoursOld: opt.value })
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Decision Label (mobile) */}
          <div className="sm:hidden">
            <Label className="text-xs">Match Filter</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {DECISION_LABELS.map((dl) => (
                <button
                  key={dl.value}
                  className={`cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors ${
                    filters.decisionLabel === dl.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border/60"
                  }`}
                  onClick={() =>
                    onChange({
                      ...filters,
                      decisionLabel: dl.value as JobFilters["decisionLabel"],
                    })
                  }
                >
                  {dl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="salary-min" className="text-xs">Minimum Salary</Label>
                <Input
                  id="salary-min"
                  placeholder="Min"
                  type="number"
                  value={filters.salaryMin}
                  onChange={(e) =>
                    onChange({ ...filters, salaryMin: e.target.value })
                  }
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="salary-max" className="text-xs">Maximum Salary</Label>
                <Input
                  id="salary-max"
                  placeholder="Max"
                  type="number"
                  value={filters.salaryMax}
                  onChange={(e) =>
                    onChange({ ...filters, salaryMax: e.target.value })
                  }
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
