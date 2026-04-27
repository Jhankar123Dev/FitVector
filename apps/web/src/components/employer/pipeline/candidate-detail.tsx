"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  X,
  Mail,
  Phone,
  Briefcase,
  FileText,
  ArrowRight,
  ArrowLeft,
  XCircle,
  CalendarDays,
  ClipboardCheck,
  Send,
  Plus,
  ThumbsUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Applicant, PipelineStage, CandidateNote, CandidateVote, VoteValue, TeamMemberRole, HumanInterview } from "@/types/employer";
import {
  PIPELINE_STAGE_LABELS,
  BUCKET_LABELS,
  BUCKET_COLORS,
  TEAM_ROLE_LABELS,
  VOTE_LABELS,
  VOTE_COLORS,
} from "@/types/employer";
import Link from "next/link";
import { useApplicantNotes, useAddNote, useApplicantVotes, useCastVote } from "@/hooks/use-notes-votes";
import { useApplicantAssessments, useAssignAssessmentToApplicant } from "@/hooks/use-applicants";
import type { ApplicantAssessmentSubmission } from "@/hooks/use-applicants";
import { useAssessments } from "@/hooks/use-assessments";

// ── Human Interviews Panel ──────────────────────────────────────────

const INTERVIEW_STATUS_STYLES: Record<string, string> = {
  scheduled:   "bg-blue-50 text-blue-700",
  completed:   "bg-emerald-50 text-emerald-700",
  cancelled:   "bg-muted text-muted-foreground",
  rescheduled: "bg-amber-50 text-amber-700",
  no_show:     "bg-red-50 text-red-600",
};

const PARTICIPANT_ROLE_LABELS: Record<string, string> = {
  lead:            "Lead",
  interviewer:     "Interviewer",
  shadow:          "Shadow",
  hiring_manager:  "Hiring Manager",
};

function HumanInterviewsPanel({ interviews }: { interviews: HumanInterview[] }) {
  function formatDt(iso: string | null) {
    if (!iso) return "TBD";
    try {
      return new Date(iso).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  }

  if (interviews.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No human interviews scheduled</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Advance the candidate to schedule one.
          </p>
        </div>
        <Link
          href="/employer/interviews"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-sky-200 bg-sky-50 py-2.5 text-xs font-medium text-sky-600 hover:bg-sky-100 transition-colors"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          View Interviews page →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interviews.map((iv) => (
        <div key={iv.id} className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground/80">
              Round {iv.roundNumber}
              {iv.interviewType && (
                <span className="ml-1.5 font-normal text-muted-foreground">— {iv.interviewType}</span>
              )}
            </p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", INTERVIEW_STATUS_STYLES[iv.status] ?? "bg-muted text-muted-foreground")}>
              {iv.status.replace("_", " ")}
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatDt(iv.scheduledAt)}
          </p>

          {iv.participants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {iv.participants.map((p) => (
                <span key={p.userId} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {p.name}
                  <span className="text-muted-foreground/70">· {PARTICIPANT_ROLE_LABELS[p.role] ?? p.role}</span>
                </span>
              ))}
            </div>
          )}

          {iv.notes && (
            <p className="text-[11px] text-muted-foreground italic">{iv.notes}</p>
          )}

          {/* Join / Start CTA for scheduled interviews with a meeting link */}
          {iv.status === "scheduled" && iv.meetingLink && (
            <a
              href={iv.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-600 transition-colors"
            >
              <Video className="h-3.5 w-3.5" />
              Start Interview
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          )}
          {iv.status === "scheduled" && !iv.meetingLink && (
            <p className="mt-1 flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              <Video className="h-3.5 w-3.5 shrink-0" />
              No meeting link — add one when rescheduling
            </p>
          )}
        </div>
      ))}

      {/* Link to full interviews page */}
      <Link
        href="/employer/interviews"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-sky-200 bg-sky-50 py-2.5 text-xs font-medium text-sky-600 hover:bg-sky-100 transition-colors"
      >
        <CalendarDays className="h-3.5 w-3.5" />
        View all interviews →
      </Link>
    </div>
  );
}

// ── Score bar component ─────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const barColor =
    value >= 80
      ? "bg-emerald-500"
      : value >= 60
        ? "bg-brand-500"
        : value >= 40
          ? "bg-amber-500"
          : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn("h-2 rounded-full transition-all duration-500", barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────
interface CandidateDetailProps {
  applicant: Applicant;
  onClose: () => void;
  onAdvance: (id: string) => void;
  onGoBack: (id: string) => void;
  onReject: (id: string) => void;
}

export function CandidateDetail({
  applicant,
  onClose,
  onAdvance,
  onGoBack,
  onReject,
}: CandidateDetailProps) {
  const [noteText, setNoteText] = useState("");
  const [assessmentTabActive, setAssessmentTabActive] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [showAssignTestModal, setShowAssignTestModal] = useState(false);
  const { data: notesData } = useApplicantNotes(applicant.id);
  const { data: votesData } = useApplicantVotes(applicant.id);
  const { data: assessmentsData, isLoading: assessmentsLoading } = useApplicantAssessments(
    assessmentTabActive ? applicant.id : null,
  );
  const assessmentSubmissions: ApplicantAssessmentSubmission[] = (assessmentsData?.data || []);
  const { data: assessmentLibraryData } = useAssessments();
  const assessmentLibrary = (assessmentLibraryData?.data || []) as Array<{ id: string; name: string; assessment_type: string; time_limit_minutes: number | null; difficulty: string | null }>;
  const assignTestMutation = useAssignAssessmentToApplicant();
  const addNoteMutation = useAddNote();
  const castVoteMutation = useCastVote();
  const notes = (notesData?.data || applicant.notes || []) as unknown as CandidateNote[];
  const votes = (votesData?.data || []) as unknown as CandidateVote[];
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials = applicant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const scoreColor =
    applicant.screeningScore >= 80
      ? "text-emerald-600 bg-emerald-50"
      : applicant.screeningScore >= 60
        ? "text-brand-600 bg-brand-50"
        : applicant.screeningScore >= 40
          ? "text-amber-600 bg-amber-50"
          : "text-red-600 bg-red-50";

  function addNote() {
    if (!noteText.trim()) return;
    const n: CandidateNote = {
      id: `note-${Date.now()}`,
      authorName: "Arjun Mehta",
      authorRole: "admin",
      content: noteText.trim(),
      createdAt: new Date().toISOString(),
    };
    addNoteMutation.mutate({ applicantId: applicant.id, body: noteText.trim() });
    setNoteText("");
  }

  function castVote(value: VoteValue) {
    castVoteMutation.mutate({ applicantId: applicant.id, vote: value });
  }

  function handleNoteKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "@") {
      setMentionOpen(true);
      setMentionFilter("");
    } else if (mentionOpen) {
      if (e.key === "Escape") {
        setMentionOpen(false);
      }
    }
  }

  function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setNoteText(val);
    // Check if we're in mention mode
    const lastAt = val.lastIndexOf("@");
    if (lastAt >= 0 && mentionOpen) {
      setMentionFilter(val.slice(lastAt + 1).toLowerCase());
    }
  }

  function insertMention(name: string) {
    const lastAt = noteText.lastIndexOf("@");
    const newText = noteText.slice(0, lastAt) + "@" + name + " ";
    setNoteText(newText);
    setMentionOpen(false);
    textareaRef.current?.focus();
  }

  const filteredTeam = useMemo(
    () =>
      ([] as Array<{ id: string; name: string | null; role: TeamMemberRole }>).filter(
        (m) => m.name && m.name.toLowerCase().includes(mentionFilter),
      ),
    [mentionFilter],
  );

  // Decision summary
  const decisionSummary = useMemo(() => {
    if (votes.length === 0) return null;
    const positive = votes.filter((v) => v.vote === "strong_hire" || v.vote === "hire").length;
    const negative = votes.filter((v) => v.vote === "no_hire" || v.vote === "strong_no_hire").length;
    if (positive > 0 && negative === 0) return { type: "consensus" as const, label: "Team Consensus: Hire" };
    if (negative > 0 && positive === 0) return { type: "consensus_no" as const, label: "Team Consensus: No Hire" };
    return { type: "split" as const, label: `Team Split: ${positive} Hire / ${negative} No Hire` };
  }, [votes]);

  const myVote = votes.find((v) => v.voterId === "tm-001");

  const b = applicant.screeningBreakdown;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-background shadow-xl sm:w-[480px] md:w-[520px]">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-border p-3 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-muted text-base sm:text-lg font-bold text-muted-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base sm:text-lg font-semibold text-foreground">
                {applicant.name}
              </h2>
              <p className="truncate text-xs sm:text-sm text-muted-foreground">
                {applicant.currentRole} @ {applicant.currentCompany}
              </p>
              <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-none">{applicant.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" />
                  {applicant.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 shrink-0" />
                  {applicant.experience}y exp
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Score badge */}
            {applicant.screeningScore > 0 && (
              <div className={cn("rounded-lg px-3 py-1.5 text-center", scoreColor)}>
                <p className="text-2xl font-bold">{applicant.screeningScore}</p>
                <p className="text-[10px] font-medium">Score</p>
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Tabs content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <Tabs
            defaultValue="screening"
            className="flex h-full flex-col"
            onValueChange={(val) => {
              if (val === "assessment") setAssessmentTabActive(true);
            }}
          >
            <div className="border-b border-border px-3 pt-2 sm:px-5 overflow-x-auto">
              <TabsList className="w-max sm:w-full justify-start bg-transparent p-0 h-auto">
                {["resume", "screening", "ai_interview", "assessment", "human_interview", "notes"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs font-medium data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {tab === "resume"
                      ? "Resume"
                      : tab === "screening"
                        ? "Screening"
                        : tab === "ai_interview"
                          ? "AI Interview"
                          : tab === "assessment"
                            ? "Assessment"
                            : tab === "human_interview"
                              ? "Human Int."
                              : "Notes"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
              {/* ── Resume Tab ────────────────────────────────────── */}
              <TabsContent value="resume" className="mt-0 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {applicant.parsedResume.summary}
                </p>

                {applicant.resumePdfUrl ? (
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href={applicant.resumePdfUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-3.5 w-3.5" />
                      View PDF
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" disabled>
                    <FileText className="h-3.5 w-3.5" />
                    PDF not available
                  </Button>
                )}

                {/* Experience */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Experience
                  </h4>
                  <div className="space-y-3">
                    {(applicant.parsedResume.experience ?? []).map((exp, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">
                            {exp.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {exp.duration}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{exp.company}</p>
                        <ul className="mt-2 space-y-1">
                          {(exp.highlights ?? []).map((h, j) => (
                            <li
                              key={j}
                              className="text-xs text-muted-foreground before:mr-1.5 before:content-['•']"
                            >
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Education
                  </h4>
                  {(applicant.parsedResume.education ?? []).map((edu, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">
                        {edu.degree}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {edu.institution} — {edu.year}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(applicant.parsedResume.skills ?? []).map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                {(applicant.parsedResume.projects ?? []).length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Projects
                    </h4>
                    {(applicant.parsedResume.projects ?? []).map((p, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium text-foreground">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Screening Tab ─────────────────────────────────── */}
              <TabsContent value="screening" className="mt-0 space-y-5">
                {applicant.screeningScore > 0 ? (
                  <>
                    {/* Bucket */}
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "border text-sm px-3 py-1",
                          BUCKET_COLORS[applicant.screeningBucket],
                        )}
                      >
                        {BUCKET_LABELS[applicant.screeningBucket]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Score: <strong className="text-foreground">{applicant.screeningScore}/100</strong>
                      </span>
                    </div>

                    {/* AI Summary */}
                    <div className="rounded-lg bg-muted/30 p-4">
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        AI Screening Summary
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {applicant.screeningSummary}
                      </p>
                    </div>

                    {/* Score breakdown bars */}
                    <div>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Score Breakdown
                      </h4>
                      <div className="space-y-3">
                        <ScoreBar label="Skill Match (30%)" value={b.skillMatch} />
                        <ScoreBar label="Experience Relevance (25%)" value={b.experienceRelevance} />
                        <ScoreBar label="Education Fit (10%)" value={b.educationFit} />
                        <ScoreBar label="Achievement Signals (15%)" value={b.achievementSignals} />
                        <ScoreBar label="Cultural Fit (10%)" value={b.cultureFit} />
                        <ScoreBar label="Screening Questions (10%)" value={b.screeningQuestions} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                    <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Not yet screened
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      AI screening will run automatically
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── AI Interview Tab ──────────────────────────────── */}
              <TabsContent value="ai_interview" className="mt-0">
                {["ai_interviewed", "human_interview", "offer", "hired"].includes(
                  applicant.pipelineStage,
                ) ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted/30 p-4">
                      <p className="text-sm text-foreground/80">
                        AI Interview completed. Detailed transcript and evaluation
                        report available.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Key Findings
                      </h4>
                      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        <li className="before:mr-1.5 before:text-emerald-500 before:content-['✓']">
                          Strong technical depth demonstrated
                        </li>
                        <li className="before:mr-1.5 before:text-emerald-500 before:content-['✓']">
                          Clear communication style
                        </li>
                        <li className="before:mr-1.5 before:text-amber-500 before:content-['△']">
                          Could improve on system design depth
                        </li>
                      </ul>
                    </div>
                    <Button variant="outline" size="sm">
                      View Full Report
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                    <Send className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      AI Interview not started
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Advance the candidate to send an interview invite
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Assessment Tab ────────────────────────────────── */}
              <TabsContent value="assessment" className="mt-0 space-y-3">
                {/* Assign Test button — always visible */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Test History ({assessmentSubmissions.length})
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-7 px-2 text-xs"
                    onClick={() => setShowAssignTestModal(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Assign Test
                  </Button>
                </div>

                {/* Assign Test modal */}
                {showAssignTestModal && (
                  <>
                    <div
                      className="fixed inset-0 z-[60] bg-black/40"
                      onClick={() => setShowAssignTestModal(false)}
                    />
                    <div className="fixed left-1/2 top-1/2 z-[70] w-[340px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover shadow-2xl">
                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <h3 className="text-sm font-semibold text-foreground">Assign Test to {applicant.name}</h3>
                        <button
                          onClick={() => setShowAssignTestModal(false)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {assessmentLibrary.length === 0 ? (
                          <p className="py-6 text-center text-sm text-muted-foreground/70">No assessments in your library yet.</p>
                        ) : (
                          assessmentLibrary.map((a) => (
                            <button
                              key={a.id}
                              disabled={assignTestMutation.isPending}
                              onClick={() => {
                                assignTestMutation.mutate(
                                  { assessmentId: a.id, applicantId: applicant.id, jobPostId: applicant.jobPostId },
                                  { onSuccess: () => setShowAssignTestModal(false) },
                                );
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-muted/50 disabled:opacity-50"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                                <p className="text-[11px] text-muted-foreground capitalize">
                                  {(a.assessment_type || "").replace(/_/g, " ")}
                                  {a.difficulty ? ` · ${a.difficulty}` : ""}
                                  {a.time_limit_minutes ? ` · ${a.time_limit_minutes}min` : ""}
                                </p>
                              </div>
                              <Send className="h-3.5 w-3.5 shrink-0 text-brand-500 ml-2" />
                            </button>
                          ))
                        )}
                      </div>
                      {assignTestMutation.isPending && (
                        <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
                          Assigning…
                        </div>
                      )}
                    </div>
                  </>
                )}

                {assessmentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading assessments…</span>
                  </div>
                ) : assessmentSubmissions.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                    <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">No assessments assigned yet</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">Use &ldquo;Assign Test&rdquo; to send one</p>
                  </div>
                ) : (
                  assessmentSubmissions.map((sub, idx) => {
                    const isExpanded = expandedSubmissionId === sub.id;
                    const scoreColor =
                      sub.finalScore === null
                        ? "text-muted-foreground/70"
                        : sub.finalScore >= 80
                          ? "text-emerald-600"
                          : sub.finalScore >= 60
                            ? "text-brand-600"
                            : sub.finalScore >= 40
                              ? "text-amber-600"
                              : "text-red-600";
                    const scoreBg =
                      sub.finalScore === null
                        ? "bg-muted"
                        : sub.finalScore >= 80
                          ? "bg-emerald-50"
                          : sub.finalScore >= 60
                            ? "bg-brand-50"
                            : sub.finalScore >= 40
                              ? "bg-amber-50"
                              : "bg-red-50";

                    const statusLabel: Record<string, string> = {
                      invited: "Invited",
                      started: "In Progress",
                      submitted: "Submitted",
                      graded: "Graded",
                      expired: "Expired",
                    };
                    const statusStyle: Record<string, string> = {
                      invited: "bg-muted text-muted-foreground",
                      started: "bg-amber-50 text-amber-700",
                      submitted: "bg-blue-50 text-blue-700",
                      graded: "bg-emerald-50 text-emerald-700",
                      expired: "bg-red-50 text-red-500",
                    };

                    return (
                      <div key={sub.id} className="rounded-lg border border-border overflow-hidden">
                        {/* ── Card header ── */}
                        <div
                          className="flex cursor-pointer items-center justify-between gap-3 p-3 hover:bg-muted/50"
                          onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground truncate">
                                Round {idx + 1}: {sub.assessmentName}
                              </p>
                              <Badge
                                className={cn("text-[10px] px-1.5 py-0 border-0", statusStyle[sub.status] || "bg-muted text-muted-foreground")}
                              >
                                {statusLabel[sub.status] || sub.status}
                              </Badge>
                              {sub.proctoring.flagged && (
                                <Badge className="text-[10px] px-1.5 py-0 border-0 bg-red-50 text-red-600 gap-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  Flagged
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground capitalize">
                              {sub.assessmentType.replace(/_/g, " ")}
                              {sub.difficulty ? ` · ${sub.difficulty}` : ""}
                              {sub.timeLimitMinutes ? ` · ${sub.timeLimitMinutes}min` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {sub.finalScore !== null ? (
                              <div className={cn("rounded-lg px-2 py-1 text-center", scoreBg)}>
                                <p className={cn("text-lg font-bold leading-tight", scoreColor)}>{sub.finalScore}</p>
                                <p className="text-[9px] text-muted-foreground/70">/ 100</p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">—</span>
                            )}
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground/70" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                            }
                          </div>
                        </div>

                        {/* ── Expanded detail ── */}
                        {isExpanded && (
                          <div className="border-t border-border bg-muted/30 p-3 space-y-3">
                            {/* Score & pass/fail row */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-card border border-border p-2 text-center">
                                <p className={cn("text-xl font-bold", scoreColor)}>
                                  {sub.finalScore !== null ? sub.finalScore : "—"}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70">Score</p>
                              </div>
                              <div className="rounded-lg bg-card border border-border p-2 text-center">
                                {sub.timeTakenMinutes !== null ? (
                                  <>
                                    <p className="text-xl font-bold text-foreground/80">{sub.timeTakenMinutes}m</p>
                                    <p className="text-[10px] text-muted-foreground/70">Time taken</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xl font-bold text-muted-foreground/40">—</p>
                                    <p className="text-[10px] text-muted-foreground/70">Time taken</p>
                                  </>
                                )}
                              </div>
                              <div className="rounded-lg bg-card border border-border p-2 text-center">
                                {sub.passed !== null ? (
                                  <>
                                    <p className={cn("text-sm font-bold", sub.passed ? "text-emerald-600" : "text-red-500")}>
                                      {sub.passed ? "Pass" : "Fail"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/70">≥{sub.passingScore} to pass</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm font-bold text-muted-foreground/40">—</p>
                                    <p className="text-[10px] text-muted-foreground/70">Pass/Fail</p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Proctoring flags */}
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Proctoring Report</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className={cn(
                                  "flex items-center gap-2 rounded-lg border p-2",
                                  sub.proctoring.tabSwitches >= 3
                                    ? "border-red-200 bg-red-50"
                                    : sub.proctoring.tabSwitches >= 1
                                      ? "border-amber-200 bg-amber-50"
                                      : "border-emerald-200 bg-emerald-50"
                                )}>
                                  {sub.proctoring.tabSwitches >= 3
                                    ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                    : sub.proctoring.tabSwitches >= 1
                                      ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                      : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  }
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{sub.proctoring.tabSwitches}</p>
                                    <p className="text-[10px] text-muted-foreground">Tab switches</p>
                                  </div>
                                </div>
                                <div className={cn(
                                  "flex items-center gap-2 rounded-lg border p-2",
                                  sub.proctoring.copyPasteAttempts >= 2
                                    ? "border-red-200 bg-red-50"
                                    : sub.proctoring.copyPasteAttempts >= 1
                                      ? "border-amber-200 bg-amber-50"
                                      : "border-emerald-200 bg-emerald-50"
                                )}>
                                  {sub.proctoring.copyPasteAttempts >= 2
                                    ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                    : sub.proctoring.copyPasteAttempts >= 1
                                      ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                      : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  }
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{sub.proctoring.copyPasteAttempts}</p>
                                    <p className="text-[10px] text-muted-foreground">Copy/paste</p>
                                  </div>
                                </div>
                                {sub.proctoring.submittedLate && (
                                  <div className="col-span-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-700">
                                      Submitted {sub.proctoring.lateByMinutes}m late
                                    </p>
                                  </div>
                                )}
                                {sub.plagiarismFlag && (
                                  <div className="col-span-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                    <p className="text-xs text-red-700">Plagiarism flag raised</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Timeline */}
                            <div>
                              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {sub.invitedAt && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground/70">Invited</span>
                                    <span>{new Date(sub.invitedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  </div>
                                )}
                                {sub.startedAt && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground/70">Started</span>
                                    <span>{new Date(sub.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  </div>
                                )}
                                {sub.submittedAt && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground/70">Submitted</span>
                                    <span>{new Date(sub.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Grader notes */}
                            {sub.graderNotes && (
                              <div className="rounded-lg bg-card border border-border p-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Grader Notes</p>
                                <p className="text-xs text-foreground/80">{sub.graderNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>

              {/* ── Human Interview Tab ───────────────────────────── */}
              <TabsContent value="human_interview" className="mt-0">
                <HumanInterviewsPanel interviews={applicant.humanInterviews ?? []} />
              </TabsContent>

              {/* ── Notes Tab ─────────────────────────────────────── */}
              <TabsContent value="notes" className="mt-0 space-y-5">
                {/* ── Team Feedback / Voting ─────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground/80">Team Feedback</p>
                  </div>

                  {/* Cast your vote */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">Your vote:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(["strong_hire", "hire", "no_hire", "strong_no_hire"] as VoteValue[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => castVote(v)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors",
                            myVote?.vote === v
                              ? VOTE_COLORS[v]
                              : "border-border text-muted-foreground hover:border-border/80",
                          )}
                        >
                          {VOTE_LABELS[v]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* All votes */}
                  {votes.length > 0 && (
                    <div className="space-y-1.5">
                      {votes.map((v) => (
                        <div key={v.id} className="flex items-center gap-2">
                          <span className="text-xs text-foreground/80">{v.voterName}</span>
                          <Badge variant="secondary" className="text-[9px]">
                            {TEAM_ROLE_LABELS[v.voterRole]}
                          </Badge>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", VOTE_COLORS[v.vote])}>
                            {VOTE_LABELS[v.vote]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {votes.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/70">No votes yet. Be the first to share your feedback.</p>
                  )}

                  {/* Decision summary */}
                  {decisionSummary && (
                    <div
                      className={cn(
                        "rounded-lg p-2.5 text-xs font-medium",
                        decisionSummary.type === "consensus"
                          ? "bg-emerald-50 text-emerald-700"
                          : decisionSummary.type === "consensus_no"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {decisionSummary.label}
                      {decisionSummary.type === "split" && (
                        <span className="block mt-0.5 text-[11px] font-normal opacity-80">
                          Consider discussing before advancing.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-border" />

                {/* ── Add note with @mentions ────────────────────── */}
                <div className="space-y-2">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Add a note... (type @ to mention a team member)"
                      value={noteText}
                      onChange={handleNoteChange}
                      onKeyDown={handleNoteKeyDown}
                      className="min-h-[80px]"
                    />
                    {/* @mention dropdown */}
                    {mentionOpen && filteredTeam.length > 0 && (
                      <div className="absolute left-0 bottom-full mb-1 z-10 w-60 rounded-lg border border-border bg-popover shadow-lg">
                        {filteredTeam.map((m) => (
                          <button
                            key={m.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault(); // prevent blur
                              insertMention(m.name!);
                            }}
                          >
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
                              {m.name!.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <span className="font-medium text-foreground">{m.name}</span>
                            <Badge variant="secondary" className="text-[8px] ml-auto">
                              {TEAM_ROLE_LABELS[m.role]}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={addNote}
                    disabled={!noteText.trim()}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Note
                  </Button>
                </div>

                {/* ── Notes list with @mention highlighting ──────── */}
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {note.authorName}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {TEAM_ROLE_LABELS[note.authorRole]}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatRelativeTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        <RenderNoteContent content={note.content} />
                      </p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground/70">
                      No notes yet
                    </p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* ── Footer actions ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-t border-border bg-background p-3 sm:p-4">
          {applicant.pipelineStage !== "hired" &&
            applicant.pipelineStage !== "rejected" && (
              <>
                {applicant.pipelineStage !== "applied" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGoBack(applicant.id)}
                    className="gap-1.5 text-muted-foreground hover:text-foreground/80"
                    title="Move to previous stage"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1 gap-1.5"
                  onClick={() => onAdvance(applicant.id)}
                >
                  <ArrowRight className="h-4 w-4" />
                  {applicant.pipelineStage === "ai_screened"
                    ? "Advance → Auto-send Assessment"
                    : applicant.pipelineStage === "assessment_pending"
                      ? "Mark Test Complete"
                      : applicant.pipelineStage === "assessment_completed"
                        ? "Advance → Auto-send AI Interview"
                        : applicant.pipelineStage === "ai_interview_pending"
                          ? "Mark Interview Given"
                          : applicant.pipelineStage === "ai_interviewed"
                            ? "Schedule Interview"
                            : applicant.pipelineStage === "human_interview"
                              ? "Make Offer"
                              : applicant.pipelineStage === "offer"
                                ? "Mark Hired"
                                : "Advance"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onReject(applicant.id)}
                  className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          {applicant.pipelineStage === "hired" && (
            <Badge variant="success" className="mx-auto text-sm px-4 py-1.5">
              Hired
            </Badge>
          )}
          {applicant.pipelineStage === "rejected" && (
            <Badge variant="destructive" className="mx-auto text-sm px-4 py-1.5">
              Rejected
            </Badge>
          )}
        </div>
      </div>
    </>
  );
}

// ── Render note content with @mention highlighting ──────────────────
const TEAM_NAMES: string[] = []; // Will be populated from API team members in future

function RenderNoteContent({ content }: { content: string }) {
  // Split on @Name patterns and highlight them
  const parts: React.ReactNode[] = [];
  let remaining = content;
  let key = 0;

  while (remaining.length > 0) {
    const atIndex = remaining.indexOf("@");
    if (atIndex < 0) {
      parts.push(remaining);
      break;
    }

    // Add text before @
    if (atIndex > 0) {
      parts.push(remaining.slice(0, atIndex));
    }

    // Check if what follows @ matches a team member name
    const afterAt = remaining.slice(atIndex + 1);
    const matchedName = TEAM_NAMES.find((name) => afterAt.startsWith(name));

    if (matchedName) {
      parts.push(
        <span key={key++} className="text-brand-600 font-medium">
          @{matchedName}
        </span>,
      );
      remaining = remaining.slice(atIndex + 1 + matchedName.length);
    } else {
      parts.push("@");
      remaining = remaining.slice(atIndex + 1);
    }
  }

  return <>{parts}</>;
}
