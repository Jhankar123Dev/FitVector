"use client";

import { useState } from "react";
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
} from "lucide-react";
import { MOCK_COMPANY } from "@/lib/mock/employer-data";

export default function EmployerSettingsPage() {
  const [companyName, setCompanyName] = useState(MOCK_COMPANY.name);
  const [website, setWebsite] = useState(MOCK_COMPANY.websiteUrl);
  const [description, setDescription] = useState(MOCK_COMPANY.description);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-800">Settings</h1>
        <p className="mt-0.5 text-sm text-surface-500">
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
              <Input value="SaaS" disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Company Size</Label>
              <Input value={MOCK_COMPANY.companySize} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Locations</Label>
              <Input value={MOCK_COMPANY.locations.join(", ")} disabled className="mt-1" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
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
              {MOCK_COMPANY.planTier} Plan
            </Badge>
            <Button size="sm" variant="outline">
              Upgrade Plan
            </Button>
          </div>
          <p className="mt-2 text-sm text-surface-500">
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
            <div key={notif.label} className="flex items-center justify-between rounded-lg border border-surface-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-surface-700">{notif.label}</p>
                <p className="text-xs text-surface-400">{notif.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={notif.enabled} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-surface-200 peer-checked:bg-brand-500 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

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
              <p className="text-sm font-medium text-surface-700">Two-Factor Authentication</p>
              <p className="text-xs text-surface-400">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">Enable 2FA</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-surface-700">API Keys</p>
              <p className="text-xs text-surface-400">Manage integration API keys</p>
            </div>
            <Button variant="outline" size="sm">Manage Keys</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
