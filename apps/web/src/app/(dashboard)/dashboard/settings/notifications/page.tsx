"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Mail, Smartphone, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type NotifPrefs = {
  email_daily_digest: boolean;
  email_app_status: boolean;
  email_followup_reminders: boolean;
  email_weekly_analytics: boolean;
  push_new_matches: boolean;
  push_status_updates: boolean;
  push_reminders: boolean;
};

const DEFAULTS: NotifPrefs = {
  email_daily_digest: true,
  email_app_status: true,
  email_followup_reminders: true,
  email_weekly_analytics: false,
  push_new_matches: true,
  push_status_updates: true,
  push_reminders: true,
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
      </label>
    </div>
  );
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user/notification-preferences")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setPrefs({ ...DEFAULTS, ...json.data });
      })
      .catch(() => toast.error("Failed to load notification preferences"))
      .finally(() => setLoading(false));
  }, []);

  const set = useCallback((key: keyof NotifPrefs) => (value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Choose how and when you want to be notified
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Email Notifications
          </CardTitle>
          <CardDescription>Updates sent to your email</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <ToggleRow
            label="Daily job digest"
            description="Receive a daily summary of new matching jobs"
            checked={prefs.email_daily_digest}
            onChange={set("email_daily_digest")}
          />
          <ToggleRow
            label="Application status changes"
            description="Get notified when your application status updates"
            checked={prefs.email_app_status}
            onChange={set("email_app_status")}
          />
          <ToggleRow
            label="Follow-up reminders"
            description="Reminder emails for scheduled follow-ups"
            checked={prefs.email_followup_reminders}
            onChange={set("email_followup_reminders")}
          />
          <ToggleRow
            label="Weekly analytics"
            description="Weekly summary of your job search performance"
            checked={prefs.email_weekly_analytics}
            onChange={set("email_weekly_analytics")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" />
            Push Notifications
          </CardTitle>
          <CardDescription>Browser push notifications</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <ToggleRow
            label="New job matches"
            description="When new high-scoring jobs match your profile"
            checked={prefs.push_new_matches}
            onChange={set("push_new_matches")}
          />
          <ToggleRow
            label="Status updates"
            description="Real-time application status changes"
            checked={prefs.push_status_updates}
            onChange={set("push_status_updates")}
          />
          <ToggleRow
            label="Follow-up reminders"
            description="Push reminder for upcoming follow-ups"
            checked={prefs.push_reminders}
            onChange={set("push_reminders")}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
