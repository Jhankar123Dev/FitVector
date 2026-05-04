"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Globe,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useEmployer, useUpdateCompany } from "@/hooks/use-employer";
import { CalendarSyncCard } from "@/components/settings/calendar-sync-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function EmployerSettingsPage() {
  const { data: employerData, isLoading, error } = useEmployer();
  const updateCompany = useUpdateCompany();
  const company = employerData?.data?.company;

  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Initialize form state when company data loads
  useEffect(() => {
    if (company) {
      setCompanyName(company.name || "");
      setWebsite(company.websiteUrl || "");
      setDescription(company.description || "");
    }
  }, [company]);

  const handleSave = async () => {
    try {
      await updateCompany.mutateAsync({
        name: companyName,
        websiteUrl: website || null,
        description,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <div className="h-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        Failed to load company data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your company profile and account settings
        </p>
      </div>

      {/* Company Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <Building2 className="h-4 w-4 text-brand-500" />
            </div>
            Company Profile
          </CardTitle>
          <CardDescription>Basic information about your company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Website</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Company Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Industry</Label>
              <Input value={company.industry || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Company Size</Label>
              <Input value={company.companySize || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Locations</Label>
              <Input
                value={
                  company.locations
                    ?.map((l: { city: string; state?: string; country: string }) => [l.city, l.state, l.country].filter(Boolean).join(", "))
                    .join(" · ") || ""
                }
                disabled
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={updateCompany.isPending} className="gap-1.5">
              {updateCompany.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saveStatus === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {updateCompany.isPending
                ? "Saving..."
                : saveStatus === "success"
                  ? "Saved!"
                  : "Save Changes"}
            </Button>
            {saveStatus === "error" && (
              <span className="text-xs text-red-500">Failed to save. Try again.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50">
              <CreditCard className="h-4 w-4 text-accent-600" />
            </div>
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="brand" className="text-sm capitalize">
              {company.planTier} Plan
            </Badge>
            <Button size="sm" variant="outline">
              Upgrade Plan
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Growth plan includes AI screening, interviews, and team collaboration for up to 50 employees.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive updates about applications and hiring activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "New applications", description: "Get notified when candidates apply", enabled: true },
            { label: "Interview completed", description: "Alerts when AI interviews finish", enabled: true },
            { label: "Weekly hiring digest", description: "Summary of pipeline activity", enabled: false },
            { label: "Team activity", description: "When team members take actions", enabled: true },
          ].map((notif) => (
            <div key={notif.label} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground/80">{notif.label}</p>
                <p className="text-xs text-muted-foreground/70">{notif.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={notif.enabled} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-brand-500 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Appearance */}
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

      {/* Calendar Sync */}
      <CalendarSyncCard />

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            Security
          </CardTitle>
          <CardDescription>Account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/80">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground/70">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">Enable 2FA</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/80">API Keys</p>
              <p className="text-xs text-muted-foreground/70">Manage integration API keys</p>
            </div>
            <Button variant="outline" size="sm">Manage Keys</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
