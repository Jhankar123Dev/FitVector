"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useUser } from "@/hooks/use-user";
import { useSeekerProfile, useUpdateSeekerProfile } from "@/hooks/use-seeker-profile";
import type { WorkHistoryEntry } from "@/hooks/use-seeker-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  User,
  CreditCard,
  Bell,
  ShieldCheck,
  Briefcase,
  Phone,
  Link,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { CalendarSyncCard } from "@/components/settings/calendar-sync-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatWorkPeriod(entry: WorkHistoryEntry): string {
  const start = entry.startDate || "?";
  const end   = entry.isCurrent ? "Present" : (entry.endDate || "?");
  return `${start} – ${end}`;
}

// ─── Blank work-history form state ───────────────────────────────────────────

const BLANK_WORK: WorkHistoryEntry = {
  company:     "",
  title:       "",
  startDate:   "",
  endDate:     null,
  isCurrent:   false,
  description: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useUser();

  // ── Basic profile (name) ──
  const [name, setName]       = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync name from session once it resolves (useState only initialises once,
  // so user?.name is null on the first render while the session is loading)
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/user/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(name.trim() ? { name: name.trim() } : {}),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Professional profile data ──
  const { data: profileData, isLoading: profileLoading } = useSeekerProfile();
  const updateProfile = useUpdateSeekerProfile();
  const profile = profileData?.data;

  // Contact & links
  const [currentRole,    setCurrentRole]    = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [phone,          setPhone]          = useState("");
  const [linkedinUrl,    setLinkedinUrl]    = useState("");
  const [portfolioUrl,   setPortfolioUrl]   = useState("");

  // Skills — declared before syncedRef so they can be called during sync
  const [skillsList,    setSkillsList]    = useState<string[]>([]);
  const [skillInput,    setSkillInput]    = useState("");
  const [skillsSaving,  setSkillsSaving]  = useState(false);

  // Work history — declared before syncedRef so it can be called during sync
  const [workHistory,   setWorkHistory]   = useState<WorkHistoryEntry[]>([]);

  // Sync from server once loaded (runs during render, before paint, like getDerivedStateFromProps)
  const syncedRef = useRef(false);
  if (profile && !syncedRef.current) {
    syncedRef.current = true;
    setCurrentRole(profile.currentRole    ?? "");
    setCurrentCompany(profile.currentCompany ?? "");
    setPhone(profile.phone         ?? "");
    setLinkedinUrl(profile.linkedinUrl   ?? "");
    setPortfolioUrl(profile.portfolioUrl  ?? "");
    setSkillsList(profile.skills ?? []);
    setWorkHistory(profile.workHistory ?? []);
  }

  const [profSaving, setProfSaving] = useState(false);

  const handleSaveProfessional = async () => {
    setProfSaving(true);
    try {
      await updateProfile.mutateAsync({
        currentRole:    currentRole    || undefined,
        currentCompany: currentCompany || undefined,
        phone:          phone          || undefined,
        linkedinUrl:    linkedinUrl    || undefined,
        portfolioUrl:   portfolioUrl   || undefined,
      });
    } finally {
      setProfSaving(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsList((prev) => prev.filter((s) => s !== skill));
  };

  const handleSaveSkills = async () => {
    setSkillsSaving(true);
    try {
      await updateProfile.mutateAsync({ skills: skillsList });
    } finally {
      setSkillsSaving(false);
    }
  };

  // ── Work history ──
  const [showAddWork,   setShowAddWork]   = useState(false);
  const [editingIdx,    setEditingIdx]    = useState<number | null>(null);
  const [workForm,      setWorkForm]      = useState<WorkHistoryEntry>(BLANK_WORK);
  const [workSaving,    setWorkSaving]    = useState(false);

  const openAddWork = () => {
    setEditingIdx(null);
    setWorkForm(BLANK_WORK);
    setShowAddWork(true);
  };

  const openEditWork = (idx: number) => {
    setEditingIdx(idx);
    setWorkForm({ ...workHistory[idx] });
    setShowAddWork(true);
  };

  const cancelWork = () => {
    setShowAddWork(false);
    setEditingIdx(null);
    setWorkForm(BLANK_WORK);
  };

  const saveWorkEntry = async () => {
    const updated =
      editingIdx !== null
        ? workHistory.map((e, i) => (i === editingIdx ? workForm : e))
        : [...workHistory, workForm];

    setWorkHistory(updated);
    setShowAddWork(false);
    setEditingIdx(null);
    setWorkForm(BLANK_WORK);

    setWorkSaving(true);
    try {
      await updateProfile.mutateAsync({ workHistory: updated });
    } finally {
      setWorkSaving(false);
    }
  };

  const deleteWorkEntry = async (idx: number) => {
    const updated = workHistory.filter((_, i) => i !== idx);
    setWorkHistory(updated);
    setWorkSaving(true);
    try {
      await updateProfile.mutateAsync({ workHistory: updated });
    } finally {
      setWorkSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* ── Profile ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <User className="h-4 w-4 text-brand-500" />
            </div>
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="settings-full-name">Full Name</Label>
            <Input
              id="settings-full-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 max-w-sm"
            />
          </div>
          <div>
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={user?.email || ""} disabled className="mt-1.5 max-w-sm" />
            <p className="mt-1 text-xs text-muted-foreground/70">Email cannot be changed</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Professional Profile ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <Briefcase className="h-4 w-4 text-violet-500" />
            </div>
            Professional Profile
          </CardTitle>
          <CardDescription>
            Career details visible to employers and used for job matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profileLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {/* Contact & links section */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Current Role</Label>
                  <Input
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Current Company</Label>
                  <Input
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1.5"
                    type="tel"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    LinkedIn URL
                  </Label>
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    className="mt-1.5"
                    type="url"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    Portfolio URL
                  </Label>
                  <Input
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="mt-1.5"
                    type="url"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveProfessional}
                disabled={profSaving}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {profSaving ? "Saving..." : "Save Contact Info"}
              </Button>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Skills tag input */}
              <div>
                <Label className="mb-2 block">Skills</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-0.5 rounded-full text-brand-400 hover:text-brand-700"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-sm">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type a skill and press Enter"
                    className="h-8 text-sm flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addSkill}
                    disabled={!skillInput.trim()}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSaveSkills}
                disabled={skillsSaving}
                variant="outline"
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {skillsSaving ? "Saving..." : "Save Skills"}
              </Button>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Work history */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold text-foreground/80">Work History</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openAddWork}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Experience
                  </Button>
                </div>

                {workHistory.length === 0 && !showAddWork && (
                  <p className="text-sm text-muted-foreground/70">
                    No work history added yet. Add your experience to improve job matches.
                  </p>
                )}

                <div className="space-y-2">
                  {workHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.title} at {entry.company}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {formatWorkPeriod(entry)}
                        </p>
                        {entry.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 ml-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditWork(idx)}
                          className="h-7 px-2 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteWorkEntry(idx)}
                          disabled={workSaving}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline add / edit form */}
                {showAddWork && (
                  <div className="mt-3 rounded-xl border border-border bg-card p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground/80">
                      {editingIdx !== null ? "Edit Experience" : "Add Experience"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Company *</Label>
                        <Input
                          value={workForm.company}
                          onChange={(e) => setWorkForm((f) => ({ ...f, company: e.target.value }))}
                          placeholder="e.g. Google"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Title *</Label>
                        <Input
                          value={workForm.title}
                          onChange={(e) => setWorkForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="e.g. Software Engineer"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Input
                          value={workForm.startDate}
                          onChange={(e) => setWorkForm((f) => ({ ...f, startDate: e.target.value }))}
                          placeholder="MM/YYYY"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Input
                          value={workForm.endDate ?? ""}
                          onChange={(e) => setWorkForm((f) => ({ ...f, endDate: e.target.value || null }))}
                          placeholder="MM/YYYY"
                          disabled={workForm.isCurrent}
                          className="mt-1 h-8 text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>
                    {/* Is current toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={workForm.isCurrent}
                        onChange={(e) =>
                          setWorkForm((f) => ({
                            ...f,
                            isCurrent: e.target.checked,
                            endDate:   e.target.checked ? null : f.endDate,
                          }))
                        }
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">I currently work here</span>
                    </label>
                    <div>
                      <Label className="text-xs">Description (optional)</Label>
                      <textarea
                        value={workForm.description ?? ""}
                        onChange={(e) => setWorkForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Brief description of your role..."
                        rows={2}
                        className="mt-1 w-full resize-none rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground/80 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={saveWorkEntry}
                        disabled={!workForm.company.trim() || !workForm.title.trim()}
                        className="gap-1.5"
                      >
                        <Save className="h-3 w-3" />
                        {editingIdx !== null ? "Update" : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelWork}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Plan ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50">
              <CreditCard className="h-4 w-4 text-accent-600" />
            </div>
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="brand" className="text-sm capitalize">
              {user?.planTier || "free"} plan
            </Badge>
            {user?.planTier === "free" && (
              <Button size="sm" asChild>
                <NextLink href="/dashboard/settings/plan">Upgrade</NextLink>
              </Button>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {user?.planTier === "free"
              ? "Upgrade to unlock more searches, resume tailoring, and outreach."
              : "Thank you for being a subscriber!"}
          </p>
        </CardContent>
      </Card>

      {/* ── Notifications ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <NextLink href="/dashboard/settings/notifications">
              Manage Notification Preferences
            </NextLink>
          </Button>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7z" />
              </svg>
            </div>
            Appearance
          </CardTitle>
          <CardDescription>Customize how FitVector looks for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* ── Calendar Sync ── */}
      <CalendarSyncCard />

      {/* ── FitVector Verified ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
            </div>
            FitVector Verified
          </CardTitle>
          <CardDescription>
            Verify your identity, education, and skills for priority visibility with employers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="brand">1 of 4 verified</Badge>
            <Button size="sm" variant="outline" asChild>
              <NextLink href="/dashboard/settings/verification">
                Manage Verification →
              </NextLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
