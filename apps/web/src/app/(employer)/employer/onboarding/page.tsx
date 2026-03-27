"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Globe,
  Upload,
  Sparkles,
  X,
  Plus,
  Mail,
  ArrowLeft,
  ArrowRight,
  Check,
  UserPlus,
  Briefcase,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCompany, useInviteMember } from "@/hooks/use-employer";
import type {
  OnboardingData,
  Industry,
  CompanySize,
  TeamMemberRole,
} from "@/types/employer";
import {
  INDUSTRY_LABELS,
  COMPANY_SIZE_OPTIONS,
  TEAM_ROLE_LABELS,
} from "@/types/employer";

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

  // API hooks
  const createCompany = useCreateCompany();
  const inviteMember = useInviteMember();

  // Tag inputs
  const [keywordInput, setKeywordInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  // Team invite inputs
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMemberRole>("recruiter");

  // AI assist loading
  const [aiLoading, setAiLoading] = useState(false);

  const progress = (step / STEPS.length) * 100;

  const updateData = useCallback(
    (updates: Partial<OnboardingData>) => {
      setData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  // ── Logo upload handler ──
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateData({ logoFile: file, logoPreviewUrl: url });
  }

  // ── Tag helpers ──
  function addKeyword() {
    const kw = keywordInput.trim();
    if (kw && !data.cultureKeywords.includes(kw)) {
      updateData({ cultureKeywords: [...data.cultureKeywords, kw] });
    }
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    updateData({
      cultureKeywords: data.cultureKeywords.filter((k) => k !== kw),
    });
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

  // ── Team invite helpers ──
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

  // ── AI Assist (mock) ──
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

  // ── Navigation ──
  function handleNext() {
    if (step < STEPS.length) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  async function handleComplete() {
    setSubmitError(null);
    try {
      // Convert string locations (e.g. "Bangalore, India") to CompanyLocation objects
      const parsedLocations = data.locations.map((loc) => {
        const parts = loc.split(",").map((s) => s.trim());
        return {
          city: parts[0] || loc,
          state: parts.length > 2 ? parts[1] : undefined,
          country: parts[parts.length - 1] || "India",
        };
      });

      // 1. Create the company
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

      // 2. Send team invites (best-effort — don't block on failures)
      for (const invite of data.invites) {
        try {
          await inviteMember.mutateAsync({
            email: invite.email,
            role: invite.role,
          });
        } catch (err) {
          console.warn(`Failed to invite ${invite.email}:`, err);
        }
      }

      // 3. Navigate to employer dashboard
      router.push("/employer");
    } catch (err) {
      console.error("Company creation failed:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create company. Please try again."
      );
    }
  }

  // ── Step validation (light) ──
  const canProceed =
    step === 1
      ? data.companyName.length >= 2 && data.industry !== "" && data.companySize !== ""
      : step === 2
        ? data.description.length >= 10
        : true;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-surface-800">
          Set up your company
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Complete these steps to start hiring with FitVector
        </p>
      </div>

      {/* Progress bar + step indicator */}
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

      {/* ──────────── STEP 1: Company Basics ──────────── */}
      {step === 1 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand-50 p-2">
                <Building2 className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Company Basics
                </h2>
                <p className="text-sm text-surface-500">
                  Tell us about your company
                </p>
              </div>
            </div>

            {/* Company name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g. TechStartup Inc"
                value={data.companyName}
                onChange={(e) => updateData({ companyName: e.target.value })}
              />
            </div>

            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {data.logoPreviewUrl ? (
                  <div className="relative">
                    <img
                      src={data.logoPreviewUrl}
                      alt="Logo preview"
                      className="h-16 w-16 rounded-lg border border-surface-200 object-cover"
                    />
                    <button
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-surface-800 p-0.5 text-white hover:bg-surface-700"
                      onClick={() =>
                        updateData({ logoFile: null, logoPreviewUrl: null })
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-surface-300 text-surface-400 transition-colors hover:border-brand-400 hover:text-brand-500">
                    <Upload className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                )}
                <p className="text-xs text-surface-400">
                  PNG, JPG, or SVG. Max 2 MB.
                </p>
              </div>
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <Input
                  id="websiteUrl"
                  placeholder="https://yourcompany.com"
                  value={data.websiteUrl}
                  onChange={(e) => updateData({ websiteUrl: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <select
                id="industry"
                value={data.industry}
                onChange={(e) =>
                  updateData({ industry: e.target.value as Industry | "" })
                }
                className="flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select an industry</option>
                {Object.entries(INDUSTRY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company size */}
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
                        : "border-surface-200 text-surface-600 hover:border-surface-300",
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
      )}

      {/* ──────────── STEP 2: Company Profile ──────────── */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent-50 p-2">
                <Globe className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Company Profile
                </h2>
                <p className="text-sm text-surface-500">
                  Help candidates understand your company and culture
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Company Description *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-brand-600 hover:text-brand-700"
                  onClick={handleAiAssist}
                  disabled={aiLoading || !data.websiteUrl}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiLoading ? "Generating..." : "AI Assist"}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Tell candidates what makes your company special..."
                value={data.description}
                onChange={(e) => updateData({ description: e.target.value })}
                className="min-h-[120px]"
              />
              {!data.websiteUrl && (
                <p className="text-xs text-surface-400">
                  Add your website URL in the previous step to enable AI Assist
                </p>
              )}
            </div>

            {/* Culture keywords */}
            <div className="space-y-2">
              <Label>Culture Keywords</Label>
              <p className="text-xs text-surface-400">
                Keywords that define your company culture (used by AI for
                cultural fit evaluation)
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Remote-first, Ownership"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addKeyword}
                  disabled={!keywordInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {data.cultureKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.cultureKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="brand"
                      className="gap-1 pr-1.5"
                    >
                      {kw}
                      <button
                        onClick={() => removeKeyword(kw)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200/50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Office locations */}
            <div className="space-y-2">
              <Label>Office Locations</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Bangalore, India"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLocation();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addLocation}
                  disabled={!locationInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {data.locations.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.locations.map((loc) => (
                    <Badge
                      key={loc}
                      variant="secondary"
                      className="gap-1 pr-1.5"
                    >
                      {loc}
                      <button
                        onClick={() => removeLocation(loc)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-surface-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────────── STEP 3: Team Setup ──────────── */}
      {step === 3 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <UserPlus className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Team Setup
                </h2>
                <p className="text-sm text-surface-500">
                  Invite team members to collaborate on hiring
                </p>
              </div>
            </div>

            {/* Invite form */}
            <div className="space-y-3">
              <Label>Invite Team Members</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <Input
                    placeholder="colleague@company.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInvite();
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as TeamMemberRole)
                  }
                  className="h-10 rounded-lg border border-surface-200 bg-white px-3 text-sm text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button onClick={addInvite} disabled={!inviteEmail.trim()}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Invite
                </Button>
              </div>
            </div>

            {/* Pending invites */}
            {data.invites.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-surface-700">
                  Pending Invites ({data.invites.length})
                </p>
                <div className="divide-y divide-surface-100 rounded-lg border border-surface-200">
                  {data.invites.map((invite) => (
                    <div
                      key={invite.email}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-sm font-medium text-surface-600">
                          {invite.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-800">
                            {invite.email}
                          </p>
                          <p className="text-xs text-surface-400">
                            {TEAM_ROLE_LABELS[invite.role]}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeInvite(invite.email)}
                        className="rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.invites.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-surface-200 px-6 py-10 text-center">
                <UserPlus className="mx-auto h-8 w-8 text-surface-300" />
                <p className="mt-2 text-sm text-surface-500">
                  No invites yet. You can always add team members later.
                </p>
              </div>
            )}

            {/* Role descriptions */}
            <div className="rounded-lg bg-surface-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
                Role Permissions
              </p>
              <div className="space-y-1.5 text-xs text-surface-600">
                <p>
                  <span className="font-medium text-surface-800">Admin</span> —
                  Full access, billing, team management
                </p>
                <p>
                  <span className="font-medium text-surface-800">Recruiter</span>{" "}
                  — Post jobs, screen candidates, schedule interviews
                </p>
                <p>
                  <span className="font-medium text-surface-800">
                    Hiring Manager
                  </span>{" "}
                  — View candidates, provide feedback, approve hires
                </p>
                <p>
                  <span className="font-medium text-surface-800">Viewer</span> —
                  Read-only access to pipeline and reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────────── STEP 4: First Job ──────────── */}
      {step === 4 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand-50 p-2">
                <Briefcase className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Post Your First Job
                </h2>
                <p className="text-sm text-surface-500">
                  Create your first job post or skip for now
                </p>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {createCompany.isPending ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="mt-3 text-sm font-medium text-surface-600">
                  Setting up your company...
                </p>
                <p className="mt-1 text-xs text-surface-400">
                  Creating company profile and sending invites
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Create first job */}
                <button
                  onClick={handleComplete}
                  className="group rounded-xl border-2 border-surface-200 p-6 text-left transition-all hover:border-brand-500 hover:shadow-card-hover"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-brand-100">
                    <Briefcase className="h-6 w-6 text-brand-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-surface-800">
                    Create a Job Post
                  </h3>
                  <p className="mt-1 text-xs text-surface-500">
                    Set up your first job listing and start receiving applicants
                    with AI-powered screening
                  </p>
                </button>

                {/* Skip */}
                <button
                  onClick={handleComplete}
                  className="group rounded-xl border-2 border-dashed border-surface-200 p-6 text-left transition-all hover:border-surface-300"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 transition-colors group-hover:bg-surface-200">
                    <SkipForward className="h-6 w-6 text-surface-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-surface-800">
                    Skip for Now
                  </h3>
                  <p className="mt-1 text-xs text-surface-500">
                    Explore the dashboard first. You can create a job post
                    anytime from the Jobs page.
                  </p>
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {step < 4 && (
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="gap-1.5"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
