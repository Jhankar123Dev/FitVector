"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, User, CreditCard, Bell, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { CalendarSyncCard } from "@/components/settings/calendar-sync-card";

export default function SettingsPage() {
  const { user } = useUser();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-surface-800">Settings</h1>
        <p className="mt-1 text-sm text-surface-500">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
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
            <Label>Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 max-w-sm"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="mt-1.5 max-w-sm" />
            <p className="mt-1 text-xs text-surface-400">
              Email cannot be changed
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Plan */}
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
                <Link href="/dashboard/settings/plan">Upgrade</Link>
              </Button>
            )}
          </div>
          <p className="mt-2 text-sm text-surface-500">
            {user?.planTier === "free"
              ? "Upgrade to unlock more searches, resume tailoring, and outreach."
              : "Thank you for being a subscriber!"}
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
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings/notifications">
              Manage Notification Preferences
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Calendar Sync */}
      <CalendarSyncCard />

      {/* FitVector Verified */}
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
              <Link href="/dashboard/settings/verification">
                Manage Verification →
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
