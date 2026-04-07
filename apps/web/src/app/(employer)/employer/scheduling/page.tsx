"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarDays,
  Plus,
  Video,
  Phone,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  CheckCircle2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useScheduledInterviews } from "@/hooks/use-scheduling";
import { useAllApplicants } from "@/hooks/use-applicants";
import { useCompanyMembers } from "@/hooks/use-employer";
import type { ScheduledInterview, ScheduledInterviewType, TeamMemberRole } from "@/types/employer";
import {
  SCHEDULED_INTERVIEW_TYPE_LABELS,
  SCHEDULED_INTERVIEW_TYPE_COLORS,
  SCHEDULED_INTERVIEW_STATUS_LABELS,
  SCHEDULED_INTERVIEW_STATUS_COLORS,
  TEAM_ROLE_LABELS,
} from "@/types/employer";

// ── Type icons ──────────────────────────────────────────────────────
const TYPE_ICONS: Record<ScheduledInterviewType, React.ElementType> = {
  phone: Phone,
  video: Video,
  onsite: MapPin,
};

// ── Calendar helpers ────────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am - 6pm

export default function SchedulingPage() {
  const { data: schedulingData, isLoading } = useScheduledInterviews();
  const interviews = (schedulingData?.data || []) as unknown as ScheduledInterview[];
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedInterview, setSelectedInterview] = useState<ScheduledInterview | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const monday = useMemo(() => {
    const m = getMonday(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(monday), [monday]);

  const upcoming = useMemo(
    () =>
      interviews
        .filter((i) => i.status === "scheduled" && new Date(i.scheduledAt) >= new Date())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [interviews],
  );

  // Stats
  const thisWeekInterviews = interviews.filter((i) => {
    const d = new Date(i.scheduledAt);
    return d >= weekDays[0] && d < new Date(weekDays[6].getTime() + 86400000);
  });
  const todayInterviews = interviews.filter((i) => isSameDay(new Date(i.scheduledAt), new Date()));
  const completedCount = interviews.filter((i) => i.status === "completed").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">
            Interview Scheduling
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-surface-500">
            Manage and schedule candidate interviews
          </p>
        </div>
        <Button className="gap-1.5 w-full sm:w-auto" onClick={() => setShowScheduleModal(true)}>
          <Plus className="h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "This Week", value: thisWeekInterviews.length, icon: CalendarDays, iconBg: "bg-brand-50", iconColor: "text-brand-500" },
          { label: "Today", value: todayInterviews.length, icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          { label: "Upcoming", value: upcoming.length, icon: Calendar, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
              <div className={cn("hidden sm:flex rounded-lg p-2.5", stat.iconBg)}>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-surface-800">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-surface-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        </TabsList>

        {/* Calendar tab */}
        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-3 sm:p-4">
              {/* Week navigation */}
              <div className="mb-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset((p) => p - 1)} className="gap-1 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-semibold text-surface-800">
                    {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="text-[11px] text-brand-600 hover:underline"
                    >
                      Today
                    </button>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset((p) => p + 1)} className="gap-1 text-xs">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Week grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Day headers */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-200">
                    <div /> {/* Time column header */}
                    {weekDays.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "px-1 py-2 text-center text-[11px] sm:text-xs font-semibold",
                            isToday ? "text-brand-600" : "text-surface-600",
                          )}
                        >
                          {formatDayHeader(day)}
                          {isToday && (
                            <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots */}
                  <div className="relative">
                    {HOURS.map((hour) => (
                      <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-100" style={{ height: 60 }}>
                        <div className="flex items-start justify-end pr-2 pt-1 text-[10px] text-surface-400">
                          {hour <= 12 ? `${hour}:00` : `${hour - 12}:00`} {hour < 12 ? "AM" : "PM"}
                        </div>
                        {weekDays.map((day) => (
                          <div key={day.toISOString()} className="relative border-l border-surface-100" />
                        ))}
                      </div>
                    ))}

                    {/* Interview blocks */}
                    {interviews.map((interview) => {
                      const iDate = new Date(interview.scheduledAt);
                      const dayIndex = weekDays.findIndex((d) => isSameDay(d, iDate));
                      if (dayIndex < 0) return null;

                      const hourOffset = iDate.getHours() - 8;
                      const minuteOffset = iDate.getMinutes();
                      const top = (hourOffset * 60 + minuteOffset);
                      const height = interview.duration;
                      const TypeIcon = TYPE_ICONS[interview.type];

                      const colWidth = `calc((100% - 60px) / 7)`;
                      const left = `calc(60px + ${dayIndex} * ${colWidth})`;

                      return (
                        <button
                          key={interview.id}
                          onClick={() => setSelectedInterview(interview)}
                          className={cn(
                            "absolute rounded-md border px-1.5 py-1 text-left transition-all hover:shadow-md cursor-pointer overflow-hidden",
                            interview.type === "video" ? "bg-brand-50 border-brand-200" :
                            interview.type === "onsite" ? "bg-emerald-50 border-emerald-200" :
                            "bg-amber-50 border-amber-200",
                          )}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 30)}px`,
                            left,
                            width: colWidth,
                          }}
                        >
                          <p className="truncate text-[10px] font-semibold text-surface-800">
                            {interview.candidateName}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] text-surface-500">
                            <TypeIcon className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{formatTime(iDate)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming list tab */}
        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <CalendarDays className="h-10 w-10 text-surface-300" />
                <p className="mt-3 text-sm font-medium text-surface-600">No upcoming interviews</p>
                <p className="mt-1 text-xs text-surface-400">
                  Schedule an interview to see it here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50">
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Candidate</th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Job</th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Interviewer</th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Date & Time</th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Type</th>
                      <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((interview) => {
                      const iDate = new Date(interview.scheduledAt);
                      const TypeIcon = TYPE_ICONS[interview.type];
                      return (
                        <tr key={interview.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50">
                          <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] font-semibold text-surface-600">
                                {interview.candidateName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs sm:text-sm font-medium text-surface-800">{interview.candidateName}</p>
                                <p className="truncate text-[11px] text-surface-500">{interview.candidateEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <span className="text-xs sm:text-sm text-surface-700">{interview.jobTitle}</span>
                          </td>
                          <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <span className="text-[11px] sm:text-xs text-surface-600">
                              {interview.interviewerNames.join(", ")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <div>
                              <p className="text-[11px] sm:text-xs font-medium text-surface-800">
                                {iDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </p>
                              <p className="text-[11px] text-surface-500">
                                {formatTime(iDate)} · {interview.duration} min
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <Badge className={cn("border text-[10px] sm:text-[11px] gap-1", SCHEDULED_INTERVIEW_TYPE_COLORS[interview.type])}>
                              <TypeIcon className="h-3 w-3" />
                              {SCHEDULED_INTERVIEW_TYPE_LABELS[interview.type]}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                            {interview.type === "video" && interview.meetingLink ? (
                              <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1" asChild>
                                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                  Join
                                </a>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] gap-1"
                                onClick={() => setSelectedInterview(interview)}
                              >
                                View
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Detail modal ──────────────────────────────────────── */}
      {selectedInterview && (
        <InterviewDetailModal
          interview={selectedInterview}
          onClose={() => setSelectedInterview(null)}
        />
      )}

      {/* ── Schedule modal ────────────────────────────────────── */}
      {showScheduleModal && (
        <ScheduleInterviewModal onClose={() => setShowScheduleModal(false)} />
      )}
    </div>
  );
}

// ── Interview detail modal ──────────────────────────────────────────
function InterviewDetailModal({
  interview,
  onClose,
}: {
  interview: ScheduledInterview;
  onClose: () => void;
}) {
  const iDate = new Date(interview.scheduledAt);
  const TypeIcon = TYPE_ICONS[interview.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-surface-800">Interview Details</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Candidate info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100 text-sm font-bold text-surface-600">
              {interview.candidateName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-surface-800">{interview.candidateName}</p>
              <p className="text-xs text-surface-500">{interview.candidateEmail}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid gap-3 grid-cols-2">
            <div>
              <p className="text-[11px] text-surface-500">Job</p>
              <p className="text-xs font-medium text-surface-800">{interview.jobTitle}</p>
            </div>
            <div>
              <p className="text-[11px] text-surface-500">Type</p>
              <Badge className={cn("border text-[10px] gap-1 mt-0.5", SCHEDULED_INTERVIEW_TYPE_COLORS[interview.type])}>
                <TypeIcon className="h-3 w-3" />
                {SCHEDULED_INTERVIEW_TYPE_LABELS[interview.type]}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] text-surface-500">Date</p>
              <p className="text-xs font-medium text-surface-800">
                {iDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-surface-500">Time</p>
              <p className="text-xs font-medium text-surface-800">
                {formatTime(iDate)} · {interview.duration} min
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-surface-500">Interviewer(s)</p>
              <p className="text-xs font-medium text-surface-800">
                {interview.interviewerNames.join(", ")}
              </p>
            </div>
          </div>

          {/* Meeting link / location */}
          {interview.meetingLink && (
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-[11px] font-semibold text-brand-700 mb-1">Meeting Link</p>
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline break-all"
              >
                {interview.meetingLink}
              </a>
            </div>
          )}
          {interview.location && (
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-[11px] font-semibold text-emerald-700 mb-1">Location</p>
              <p className="text-xs text-emerald-600">{interview.location}</p>
            </div>
          )}

          {/* Interviewer notes */}
          {interview.interviewerNotes && (
            <div>
              <p className="text-[11px] font-semibold text-surface-500 mb-1">Interviewer Notes</p>
              <p className="text-xs text-surface-600 leading-relaxed">{interview.interviewerNotes}</p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-[10px]", SCHEDULED_INTERVIEW_STATUS_COLORS[interview.status])}>
              {SCHEDULED_INTERVIEW_STATUS_LABELS[interview.status]}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-surface-100 pt-3">
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              Reschedule
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs text-red-600 hover:bg-red-50">
              Cancel Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Maps UI interview type → DB interview_type enum
const UI_TYPE_TO_DB: Record<ScheduledInterviewType, string> = {
  phone: "phone_screen",
  video: "technical",
  onsite: "panel",
};

// ── Free/busy result type (mirrors server shape) ────────────────────
interface FreeBusyInterviewerResult {
  userId: string;
  email: string;
  busy: { start: string; end: string }[];
  calendarConnected: boolean;
}

// ── Schedule interview modal ────────────────────────────────────────
function ScheduleInterviewModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: applicantsData } = useAllApplicants();
  const { data: membersData } = useCompanyMembers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allApplicants = (applicantsData?.data || []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamMembers = (membersData?.data || []) as any[];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  const [interviewType, setInterviewType] = useState<ScheduledInterviewType>("video");
  const [duration, setDuration] = useState(45);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [addMeetLink, setAddMeetLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Availability state
  const [availability, setAvailability] = useState<FreeBusyInterviewerResult[]>([]);
  const [checkingAvail, setCheckingAvail] = useState(false);

  // Calendar connection status (dynamic — not hardcoded)
  const { data: calStatusData } = useQuery({
    queryKey: ["calendar-status"],
    queryFn: () => fetch("/api/user/calendar-status").then((r) => r.json()),
    staleTime: 60_000,
  });
  const calendarConnected = calStatusData?.data?.googleConnected === true;

  const filteredCandidates = useMemo(() => {
    if (!searchTerm) return allApplicants.slice(0, 6);
    return allApplicants
      .filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .slice(0, 6);
  }, [searchTerm, allApplicants]);

  const selectedCandidateObj = allApplicants.find((a) => a.id === selectedCandidate);

  // Debounced availability check — fires 600ms after date/time/duration/interviewers settle
  useEffect(() => {
    if (!date || !time || selectedInterviewers.length === 0) {
      setAvailability([]);
      return;
    }
    setCheckingAvail(true);
    const timer = setTimeout(async () => {
      try {
        const start = new Date(`${date}T${time}:00`).toISOString();
        const end = new Date(
          new Date(`${date}T${time}:00`).getTime() + duration * 60_000,
        ).toISOString();
        const res = await fetch("/api/employer/calendar/freebusy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedInterviewers, timeMin: start, timeMax: end }),
        });
        const json = await res.json();
        if (res.ok) setAvailability(json.data || []);
      } catch {
        // Availability is best-effort; ignore errors
      } finally {
        setCheckingAvail(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [date, time, duration, selectedInterviewers]);

  function toggleInterviewer(id: string) {
    setSelectedInterviewers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function handleSchedule() {
    if (!selectedCandidate || !date || selectedInterviewers.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/employer/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId: selectedCandidate,
          interviewerIds: selectedInterviewers,
          interviewType: UI_TYPE_TO_DB[interviewType],
          scheduledAt,
          durationMinutes: duration,
          addMeetLink: addMeetLink && calendarConnected,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to schedule interview");
      qc.invalidateQueries({ queryKey: ["employer", "scheduling"] });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to schedule interview");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    !!selectedCandidate && selectedInterviewers.length > 0 && !!date && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-surface-800">Schedule Interview</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* ── Dynamic Google Calendar banner ── */}
          {calendarConnected ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-800">Google Calendar connected</p>
                <p className="mt-0.5 text-emerald-700">
                  A calendar invite will be sent to all attendees automatically.
                </p>
                {interviewType === "video" && (
                  <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-emerald-700">
                    <input
                      type="checkbox"
                      checked={addMeetLink}
                      onChange={(e) => setAddMeetLink(e.target.checked)}
                      className="h-3.5 w-3.5 accent-emerald-600"
                    />
                    Auto-generate Google Meet link
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="text-xs">
                <p className="font-semibold text-amber-800">Google Calendar not connected</p>
                <p className="mt-0.5 text-amber-700">
                  This interview will be saved in FitVector but won&apos;t sync to Google Calendar.{" "}
                  <a href="/employer/settings" className="underline hover:text-amber-900">
                    Connect Google Calendar →
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Search candidate */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Select Candidate</Label>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {filteredCandidates.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedCandidate(a.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors",
                    selectedCandidate === a.id
                      ? "bg-brand-50 border border-brand-200"
                      : "hover:bg-surface-50",
                  )}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[9px] font-bold text-surface-600">
                    {a.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-surface-800">{a.name}</p>
                    <p className="truncate text-[10px] text-surface-500">{a.currentRole} @ {a.currentCompany}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Select interviewers */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">
              Select Interviewer(s)
              <span className="ml-1 text-[10px] text-surface-400">(first selected = lead)</span>
            </Label>
            <div className="space-y-1">
              {teamMembers.filter((m) => m.status === "active").map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 transition-colors",
                    selectedInterviewers.includes(m.id)
                      ? "bg-brand-50 border border-brand-200"
                      : "hover:bg-surface-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedInterviewers.includes(m.id)}
                    onChange={() => toggleInterviewer(m.id)}
                    className="h-3.5 w-3.5 accent-brand-500"
                  />
                  <span className="text-xs font-medium text-surface-800">{m.name}</span>
                  <Badge className="border text-[9px] bg-surface-100 text-surface-500 border-surface-200">
                    {TEAM_ROLE_LABELS[m.role as TeamMemberRole] || m.role}
                  </Badge>
                  {/* Availability pill — shown once date+time are set */}
                  {date && time && (() => {
                    const avail = availability.find((a) => a.userId === m.id);
                    if (checkingAvail && selectedInterviewers.includes(m.id)) {
                      return <Loader2 className="ml-auto h-3 w-3 animate-spin text-surface-400" />;
                    }
                    if (!avail) return null;
                    if (!avail.calendarConnected) {
                      return (
                        <span className="ml-auto text-[9px] text-surface-400">No calendar</span>
                      );
                    }
                    const isBusy = avail.busy.length > 0;
                    return isBusy ? (
                      <span className="ml-auto flex items-center gap-0.5 text-[9px] font-medium text-red-600">
                        <AlertCircle className="h-3 w-3" /> Busy
                      </span>
                    ) : (
                      <span className="ml-auto flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Free
                      </span>
                    );
                  })()}
                </label>
              ))}
            </div>
          </div>

          {/* Type & duration */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as ScheduledInterviewType)}
              >
                {(["phone", "video", "onsite"] as const).map((t) => (
                  <option key={t} value={t}>{SCHEDULED_INTERVIEW_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Duration</Label>
              <select
                className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
          </div>

          {/* Date & time */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Summary */}
          {selectedCandidateObj && selectedInterviewers.length > 0 && date && (
            <div className="rounded-lg bg-surface-50 p-3 text-xs text-surface-600">
              <p>
                <strong>{selectedCandidateObj.name}</strong> — {SCHEDULED_INTERVIEW_TYPE_LABELS[interviewType]}, {duration} min
              </p>
              <p>
                Interviewer: {teamMembers.find((m) => m.id === selectedInterviewers[0])?.name ?? "—"}
                {selectedInterviewers.length > 1 && ` +${selectedInterviewers.length - 1} more`}
              </p>
              <p>{date} at {time}</p>
            </div>
          )}

          {/* Error */}
          {submitError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
              {submitError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              disabled={!canSubmit}
              onClick={handleSchedule}
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Scheduling…
                </>
              ) : (
                <>
                  <CalendarDays className="h-3.5 w-3.5" />
                  Schedule
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
