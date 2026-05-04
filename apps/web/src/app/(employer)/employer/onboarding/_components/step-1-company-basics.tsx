"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Globe, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingData, Industry } from "@/types/employer";
import { INDUSTRY_LABELS, COMPANY_SIZE_OPTIONS } from "@/types/employer";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Step1CompanyBasics({ data, updateData, onLogoUpload }: Props) {
  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-50 p-2">
            <Building2 className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Company Basics</h2>
            <p className="text-sm text-muted-foreground">Tell us about your company</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            placeholder="e.g. TechStartup Inc"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            {data.logoPreviewUrl ? (
              <div className="relative">
                <img
                  src={data.logoPreviewUrl}
                  alt="Logo preview"
                  className="h-16 w-16 rounded-lg border border-border object-cover"
                />
                <button
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-white hover:bg-foreground/80"
                  onClick={() => updateData({ logoFile: null, logoPreviewUrl: null })}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border/60 text-muted-foreground/70 transition-colors hover:border-brand-400 hover:text-brand-500">
                <Upload className="h-5 w-5" />
                <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
              </label>
            )}
            <p className="text-xs text-muted-foreground/70">PNG, JPG, or SVG. Max 2 MB.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="websiteUrl"
              placeholder="https://yourcompany.com"
              value={data.websiteUrl}
              onChange={(e) => updateData({ websiteUrl: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <select
            id="industry"
            value={data.industry}
            onChange={(e) => updateData({ industry: e.target.value as Industry | "" })}
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select an industry</option>
            {Object.entries(INDUSTRY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Company Size *</Label>
          <div className="flex flex-wrap gap-2">
            {COMPANY_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  data.companySize === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border text-muted-foreground hover:border-border/60",
                )}
                onClick={() => updateData({ companySize: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
