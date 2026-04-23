"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobPostFormData, WorkMode, JobPostType } from "@/types/employer";
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from "@/types/employer";

const DEPARTMENTS = [
  "Engineering", "Design", "Product", "Marketing", "Sales",
  "Operations", "HR", "Finance", "Customer Support",
  "Infrastructure", "Data Science", "Other",
];

interface Props {
  form: JobPostFormData;
  update: (updates: Partial<JobPostFormData>) => void;
}

export function Step1BasicInfo({ form, update }: Props) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-50 p-2">
            <Briefcase className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-800">Basic Information</h2>
            <p className="text-sm text-surface-500">Job title, location, and compensation</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            placeholder="e.g. Senior Frontend Developer"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <select
            id="department"
            value={form.department}
            onChange={(e) => update({ department: e.target.value })}
            className="flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g. Bangalore, India"
              value={form.location}
              onChange={(e) => update({ location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Work Mode *</Label>
            <div className="flex gap-2">
              {(Object.entries(WORK_MODE_LABELS) as [WorkMode, string][]).map(([value, label]) => (
                <button
                  key={value}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    form.workMode === value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-surface-200 text-surface-600 hover:border-surface-300",
                  )}
                  onClick={() => update({ workMode: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Job Type *</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(JOB_TYPE_LABELS) as [JobPostType, string][]).map(([value, label]) => (
              <button
                key={value}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  form.jobType === value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-surface-200 text-surface-600 hover:border-surface-300",
                )}
                onClick={() => update({ jobType: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expMin">Min Experience (years)</Label>
            <Input
              id="expMin"
              type="number"
              min={0}
              max={30}
              value={form.experienceMin}
              onChange={(e) => update({ experienceMin: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expMax">Max Experience (years)</Label>
            <Input
              id="expMax"
              type="number"
              min={0}
              max={30}
              value={form.experienceMax}
              onChange={(e) => update({ experienceMax: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Salary Range (optional)</Label>
            <label className="flex items-center gap-2 text-xs text-surface-500">
              <input
                type="checkbox"
                checked={!form.salaryVisible}
                onChange={(e) => update({ salaryVisible: !e.target.checked })}
                className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
              />
              Hide from candidates
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={form.salaryMin}
              onChange={(e) => update({ salaryMin: e.target.value })}
            />
            <span className="text-xs text-surface-500">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={form.salaryMax}
              onChange={(e) => update({ salaryMax: e.target.value })}
            />
            <select
              value={form.salaryCurrency}
              onChange={(e) => update({ salaryCurrency: e.target.value })}
              className="h-10 rounded-lg border border-surface-200 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="openings">Number of Openings</Label>
          <Input
            id="openings"
            type="number"
            min={1}
            max={100}
            value={form.openingsCount}
            onChange={(e) => update({ openingsCount: Number(e.target.value) })}
            className="w-32"
          />
        </div>
      </CardContent>
    </Card>
  );
}
