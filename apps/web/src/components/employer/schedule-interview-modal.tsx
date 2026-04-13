"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Link2, Loader2, Users, Video, Phone, MapPin, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Applicant } from "@/types/employer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
  role: string;
  status: string;
}

export interface ScheduleInterviewData {
  applicantId:   string;
  jobPostId:     string;
  interviewerId: string;
  scheduledAt:   string;         // ISO string
  durationMins:  number;
  format:        "video" | "phone" | "in_person";
  meetingLink?:  string;
  notes?:        string;
}

interface Props {
  applicant:  Applicant;
  jobPostId:  string;
  onClose:    () => void;
  onConfirm:  (data: ScheduleInterviewData) => void;
  isPending:  boolean;
}

// ─── Format options ───────────────────────────────────────────────────────────

const FORMAT_OPTIONS: {
  value: "video" | "phone" | "in_person";
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "video",     label: "Video Call",  icon: Video,  color: "text-sky-600"     },
  { value: "phone",     label: "Phone",        icon: Phone,  color: "text-violet-600"  },
  { value: "in_person", label: "In Person",   icon: MapPin, color: "text-emerald-600" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleInterviewModal({ applicant, jobPostId, onClose, onConfirm, isPending }: Props) {
  // ── Form state ────────────────────────────────────────────────────────────
  const [interviewerId, setInterviewerId] = useState("");
  const [format,        setFormat]        = useState<"video" | "phone" | "in_person">("video");
  const [scheduledAt,   setScheduledAt]   = useState("");
  const [durationMins,  setDurationMins]  = useState(60);
  const [meetingLink,   setMeetingLink]   = useState("");
  const [notes,         setNotes]         = useState("");

  // ── Team members fetch ────────────────────────────────────────────────────
  const { data: membersData, isLoading: membersLoading } = useQuery<{ data: TeamMember[] }>({
    queryKey: ["employer", "company", "members"],
    queryFn:  async () => {
      const res = await fetch("/api/employer/company/members");
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const members = (membersData?.data ?? []).filter((m) => m.status === "active" || m.status === "invited");

  // ── Validation ────────────────────────────────────────────────────────────
  const isValid =
    interviewerId.length > 0 &&
    scheduledAt.length > 0 &&
    durationMins >= 15;

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!isValid) return;
    onConfirm({
      applicantId:   applicant.id,
      jobPostId,
      interviewerId,
      scheduledAt:   new Date(scheduledAt).toISOString(),
      durationMins,
      format,
      meetingLink:   meetingLink.trim() || undefined,
      notes:         notes.trim()       || undefined,
    });
  }

  // Min datetime = now (prevents scheduling in the past)
  const minDatetime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 border-b border-surface-200 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50">
              <CalendarDays className="h-4 w-4 text-sky-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-surface-800">Schedule Interview</h3>
              <p className="truncate text-xs text-surface-500">{applicant.name}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-surface-400 transition-colors hover:text-surface-700 text-lg font-bold leading-none"
            >
              ×
            </button>
          </div>

          {/* ── Form ──────────────────────────────────────────────── */}
          <div className="space-y-4 px-5 py-4">

            {/* Format picker */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-700">
                Interview Format <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormat(value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
                      format === value
                        ? "border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-300"
                        : "border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", format === value ? "text-brand-600" : color)} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interviewer */}
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-700">
                <Users className="mr-1 inline h-3 w-3" />
                Interviewer <span className="text-red-500">*</span>
              </label>
              {membersLoading ? (
                <div className="flex h-9 items-center gap-2 rounded-lg border border-surface-200 px-3 text-xs text-surface-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading team members…
                </div>
              ) : members.length === 0 ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  No team members found.{" "}
                  <Link
                    href="/employer/team"
                    className="font-medium underline underline-offset-2 hover:text-amber-900"
                  >
                    Click here to add your team
                  </Link>
                </div>
              ) : (
                <select
                  value={interviewerId}
                  onChange={(e) => setInterviewerId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select interviewer…</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userName ? `${m.userName} (${m.userEmail})` : m.userEmail}
                      {m.role === "admin" ? " — Admin" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date & Time */}
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-700">
                Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={minDatetime}
                className="h-9 text-sm"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-700">
                Duration (minutes)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Math.max(15, Number(e.target.value)))}
                  className="h-9 w-28 text-sm"
                />
                {/* Quick-select presets */}
                <div className="flex gap-1.5">
                  {[30, 45, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationMins(d)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs transition-colors",
                        durationMins === d
                          ? "border-brand-400 bg-brand-50 text-brand-700"
                          : "border-surface-200 text-surface-600 hover:border-surface-300",
                      )}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Meeting link — shown for video format */}
            {format === "video" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-700">
                  <Link2 className="mr-1 inline h-3 w-3" />
                  Meeting Link
                  <span className="ml-1 text-surface-400">(optional)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-700">
                <StickyNote className="mr-1 inline h-3 w-3" />
                Notes for Interviewer
                <span className="ml-1 text-surface-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Focus areas, instructions, candidate context…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full resize-none rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────── */}
          <div className="flex justify-end gap-2 border-t border-surface-200 px-5 py-3">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Scheduling…
                </>
              ) : (
                <>
                  <CalendarDays className="h-3.5 w-3.5" />
                  Schedule Interview
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
