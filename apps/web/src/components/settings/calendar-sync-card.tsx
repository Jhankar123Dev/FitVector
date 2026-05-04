"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Link2, CheckCircle2, Loader2, AlertCircle, XCircle } from "lucide-react";

interface CalendarStatus {
  googleConnected: boolean;
  outlookConnected: boolean;
}

export function CalendarSyncCard() {
  const searchParams = useSearchParams();
  const calendarParam = searchParams.get("calendar"); // "connected" | "error" | "denied"

  const [status, setStatus] = useState<CalendarStatus>({
    googleConnected: false,
    outlookConnected: false,
  });
  const [loading, setLoading] = useState(true);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  useEffect(() => {
    fetch("/api/user/calendar-status")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStatus(json.data);
      })
      .catch(() => { /* non-critical — silently ignore */ })
      .finally(() => setLoading(false));
  }, [calendarParam]); // re-fetch after OAuth redirect so status is fresh

  const handleConnectGoogle = () => {
    setConnectingGoogle(true);
    // Navigate to our custom OAuth connect route — does NOT go through NextAuth
    window.location.href = "/api/calendar/google/connect";
    // page navigates away; connectingGoogle state shows spinner until redirect
  };

  const noneConnected = !status.googleConnected && !status.outlookConnected;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
            <CalendarDays className="h-4 w-4 text-sky-600" />
          </div>
          Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect your calendar to auto-schedule interviews and track deadlines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Feedback banners from OAuth redirect */}
        {calendarParam === "connected" && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Google Calendar connected successfully!
          </div>
        )}
        {calendarParam === "denied" && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            Access was denied. Click the button below to try again.
          </div>
        )}
        {calendarParam === "error" && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Something went wrong during connection. Please try again.
          </div>
        )}

        {/* Connection buttons */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connections…
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {/* Google Calendar */}
            {status.googleConnected ? (
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Google Calendar connected
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleConnectGoogle}
                disabled={connectingGoogle}
              >
                {connectingGoogle ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
                {connectingGoogle ? "Redirecting…" : "Connect Google Calendar"}
              </Button>
            )}

            {/* Outlook — Microsoft OAuth not yet configured */}
            {status.outlookConnected ? (
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Outlook connected
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled
                title="Outlook sync coming soon"
              >
                <Link2 className="h-3 w-3" />
                Connect Outlook
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  Soon
                </span>
              </Button>
            )}

            {noneConnected && !calendarParam && (
              <span className="text-xs text-muted-foreground/70">No calendars connected</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
