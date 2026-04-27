"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Video,
  ExternalLink,
  CalendarX,
  LinkIcon,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import type { CalendarEvent } from "@/app/api/user/calendar/events/route";

// ─── Typed error ──────────────────────────────────────────────────────────────

class CalendarFetchError extends Error {
  notConnected?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDurationMins(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
}

function groupByDate(entries: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const entry of entries) {
    const key = entry.start.slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

function formatGroupHeader(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00"); // local midnight — avoids UTC shift
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString())    return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ calEvent }: { calEvent: CalendarEvent }) {
  const duration = calEvent.isAllDay
    ? null
    : getDurationMins(calEvent.start, calEvent.end);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <p className="font-semibold leading-snug text-foreground">
              {calEvent.title}
            </p>

            {/* Time row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {calEvent.isAllDay ? (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  All day
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(calEvent.start)} – {formatTime(calEvent.end)}
                  {duration !== null && (
                    <span className="text-muted-foreground/70">· {duration} min</span>
                  )}
                </span>
              )}

              {calEvent.location && (
                <span className="flex max-w-[200px] items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {calEvent.location}
                </span>
              )}
            </div>

            {/* Description preview */}
            {calEvent.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {calEvent.description.replace(/<[^>]*>/g, "")}
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            {calEvent.meetLink && (
              <Badge className="gap-1 border-sky-200 bg-sky-50 text-[10px] text-sky-700">
                <Video className="h-3 w-3" />
                Video call
              </Badge>
            )}
            {calEvent.isAllDay && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                All day
              </Badge>
            )}
          </div>
        </div>

        {/* Action row */}
        {(calEvent.meetLink || calEvent.htmlLink) && (
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            {calEvent.meetLink && (
              <Button size="sm" className="h-7 gap-1.5 text-xs" asChild>
                <a
                  href={calEvent.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-3 w-3" />
                  Join Call
                </a>
              </Button>
            )}
            {calEvent.htmlLink && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs text-muted-foreground"
                asChild
              >
                <a
                  href={calEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in Google Calendar
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const {
    data: events,
    isLoading,
    error,
    isError,
  } = useQuery<CalendarEvent[], CalendarFetchError>({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const res  = await fetch("/api/user/calendar/events");
      const json = await res.json() as { data?: CalendarEvent[]; error?: string; notConnected?: boolean };
      if (!res.ok) {
        const err = new CalendarFetchError(json.error ?? "Failed to load events");
        err.notConnected = json.notConnected ?? false;
        throw err;
      }
      return json.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const grouped    = events ? groupByDate(events) : new Map<string, CalendarEvent[]>();
  const totalCount = events?.length ?? 0;

  // ── Not connected ────────────────────────────────────────────────────────────
  if (isError && error.notConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your upcoming events from Google Calendar
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <LinkIcon className="h-6 w-6 text-muted-foreground/70" />
            </div>
            <div>
              <p className="font-semibold text-foreground/80">
                Google Calendar not connected
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your calendar from Settings to see your upcoming events
                here.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your upcoming events for the next 30 days
          </p>
        </div>
        {totalCount > 0 && (
          <Badge
            variant="outline"
            className="mt-1 shrink-0 text-xs text-muted-foreground"
          >
            {totalCount} event{totalCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Loading */}
      {isLoading && <LoadingSpinner message="Loading your calendar…" />}

      {/* Generic error */}
      {isError && !error.notConnected && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-red-600">
              {error.message || "Failed to load events. Please try again."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !isError && events?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No upcoming events</p>
            <p className="text-sm text-muted-foreground/70">
              Your Google Calendar has no events in the next 30 days.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Events grouped by date */}
      {grouped.size > 0 && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold text-foreground/80">
                  {formatGroupHeader(dateKey)}
                </h2>
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground/70">
                  {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Cards for this day */}
              <div className="space-y-3">
                {dayEvents.map((calEvent) => (
                  <EventCard key={calEvent.id} calEvent={calEvent} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
