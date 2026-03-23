"use client";

import { Bell, Mail, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

function ToggleRow({ label, description, defaultOn = true }: { label: string; description: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
        <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
      </label>
    </div>
  );
}

export default function NotificationsPage() {
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
          />
          <ToggleRow
            label="Application status changes"
            description="Get notified when your application status updates"
          />
          <ToggleRow
            label="Follow-up reminders"
            description="Reminder emails for scheduled follow-ups"
          />
          <ToggleRow
            label="Weekly analytics"
            description="Weekly summary of your job search performance"
            defaultOn={false}
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
          />
          <ToggleRow
            label="Status updates"
            description="Real-time application status changes"
          />
          <ToggleRow
            label="Follow-up reminders"
            description="Push reminder for upcoming follow-ups"
          />
        </CardContent>
      </Card>
    </div>
  );
}
