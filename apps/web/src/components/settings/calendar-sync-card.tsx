"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Link2, CheckCircle2, Loader2 } from "lucide-react";

interface CalendarStatus {
  googleConnected: boolean;
  outlookConnected: boolean;
}

export function CalendarSyncCard() {
  const pathname = usePathname();
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
      .catch(() => {/* silently ignore — non-critical */})
      .finally(() => setLoading(false));
  }, []);

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    // Pass callbackUrl so user returns to the same settings page after OAuth
    await signIn("google", { callbackUrl: pathname });
    // signIn redirects; setConnectingGoogle(false) won't be reached in normal flow
    setConnectingGoogle(false);
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
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-surface-400">
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
                <span className="ml-1 rounded-full bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-500">
                  Soon
                </span>
              </Button>
            )}

            {noneConnected && (
              <span className="text-xs text-surface-400">No calendars connected</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
