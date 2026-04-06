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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Applicant, PipelineStage, CandidateNote, CandidateVote, VoteValue, TeamMemberRole } from "@/types/employer";
import {
  PIPELINE_STAGE_LABELS,
  BUCKET_LABELS,
  BUCKET_COLORS,
  TEAM_ROLE_LABELS,
  VOTE_LABELS,
  VOTE_COLORS,
} from "@/types/employer";
import { useApplicantNotes, useAddNote, useApplicantVotes, useCastVote } from "@/hooks/use-notes-votes";

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
        <span className="text-surface-600">{label}</span>
        <span className="font-semibold text-surface-800">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-100">
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
  const { data: notesData } = useApplicantNotes(applicant.id);
  const { data: votesData } = useApplicantVotes(applicant.id);
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
        className="fixed inset-0 z-50 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-xl sm:w-[480px] md:w-[520px]">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-surface-200 p-3 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-surface-100 text-base sm:text-lg font-bold text-surface-600">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base sm:text-lg font-semibold text-surface-800">
                {applicant.name}
              </h2>
              <p className="truncate text-xs sm:text-sm text-surface-500">
                {applicant.currentRole} @ {applicant.currentCompany}
              </p>
              <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-surface-500">
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
              className="rounded-md p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Tabs content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="screening" className="flex h-full flex-col">
            <div className="border-b border-surface-200 px-3 pt-2 sm:px-5 overflow-x-auto">
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
                <p className="text-sm text-surface-600">
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
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Experience
                  </h4>
                  <div className="space-y-3">
                    {(applicant.parsedResume.experience ?? []).map((exp, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-surface-200 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-surface-800">
                            {exp.title}
                          </p>
                          <span className="text-xs text-surface-400">
                            {exp.duration}
                          </span>
                        </div>
                        <p className="text-xs text-surface-500">{exp.company}</p>
                        <ul className="mt-2 space-y-1">
                          {(exp.highlights ?? []).map((h, j) => (
                            <li
                              key={j}
                              className="text-xs text-surface-600 before:mr-1.5 before:content-['•']"
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
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Education
                  </h4>
                  {(applicant.parsedResume.education ?? []).map((edu, i) => (
                    <div key={i} className="rounded-lg border border-surface-200 p-3">
                      <p className="text-sm font-medium text-surface-800">
                        {edu.degree}
                      </p>
                      <p className="text-xs text-surface-500">
                        {edu.institution} — {edu.year}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
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
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
                      Projects
                    </h4>
                    {(applicant.parsedResume.projects ?? []).map((p, i) => (
                      <div key={i} className="rounded-lg border border-surface-200 p-3">
                        <p className="text-sm font-medium text-surface-800">
                          {p.name}
                        </p>
                        <p className="text-xs text-surface-500">{p.description}</p>
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
                      <span className="text-sm text-surface-500">
                        Score: <strong className="text-surface-800">{applicant.screeningScore}/100</strong>
                      </span>
                    </div>

                    {/* AI Summary */}
                    <div className="rounded-lg bg-surface-50 p-4">
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-surface-500">
                        AI Screening Summary
                      </h4>
                      <p className="text-sm leading-relaxed text-surface-700">
                        {applicant.screeningSummary}
                      </p>
                    </div>

                    {/* Score breakdown bars */}
                    <div>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
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
                  <div className="rounded-xl border-2 border-dashed border-surface-200 py-12 text-center">
                    <ClipboardCheck className="mx-auto h-8 w-8 text-surface-300" />
                    <p className="mt-2 text-sm text-surface-500">
                      Not yet screened
                    </p>
                    <p className="mt-1 text-xs text-surface-400">
                      AI screening will run automatically
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── AI Interview Tab ──────────────────────────────── */}
              <TabsContent value="ai_interview" className="mt-0">
                {["ai_interviewed", "assessment", "human_interview", "offer", "hired"].includes(
                  applicant.pipelineStage,
                ) ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-surface-50 p-4">
                      <p className="text-sm text-surface-700">
                        AI Interview completed. Detailed transcript and evaluation
                        report available.
                      </p>
                    </div>
                    <div className="rounded-lg border border-surface-200 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Key Findings
                      </h4>
                      <ul className="mt-2 space-y-1.5 text-sm text-surface-600">
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
                  <div className="rounded-xl border-2 border-dashed border-surface-200 py-12 text-center">
                    <Send className="mx-auto h-8 w-8 text-surface-300" />
                    <p className="mt-2 text-sm text-surface-500">
                      AI Interview not started
                    </p>
                    <p className="mt-1 text-xs text-surface-400">
                      Advance the candidate to send an interview invite
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Assessment Tab ────────────────────────────────── */}
              <TabsContent value="assessment" className="mt-0">
                {["assessment", "human_interview", "offer", "hired"].includes(
                  applicant.pipelineStage,
                ) ? (
                  <div className="rounded-lg bg-surface-50 p-4">
                    <p className="text-sm text-surface-700">
                      Assessment in progress or completed. Results will appear
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-surface-200 py-12 text-center">
                    <ClipboardCheck className="mx-auto h-8 w-8 text-surface-300" />
                    <p className="mt-2 text-sm text-surface-500">
                      No assessment assigned
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Human Interview Tab ───────────────────────────── */}
              <TabsContent value="human_interview" className="mt-0">
                {["human_interview", "offer", "hired"].includes(
                  applicant.pipelineStage,
                ) ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-surface-200 p-4">
                      <p className="text-xs font-semibold text-surface-500">
                        Scheduled Interview
                      </p>
                      <p className="mt-1 text-sm font-medium text-surface-800">
                        Technical Round with Rahul Gupta
                      </p>
                      <p className="text-xs text-surface-500">
                        March 30, 2026 at 2:00 PM IST
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Feedback
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-surface-200 py-12 text-center">
                    <CalendarDays className="mx-auto h-8 w-8 text-surface-300" />
                    <p className="mt-2 text-sm text-surface-500">
                      No human interview scheduled
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Notes Tab ─────────────────────────────────────── */}
              <TabsContent value="notes" className="mt-0 space-y-5">
                {/* ── Team Feedback / Voting ─────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-3.5 w-3.5 text-surface-500" />
                    <p className="text-xs font-semibold text-surface-700">Team Feedback</p>
                  </div>

                  {/* Cast your vote */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-surface-500">Your vote:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(["strong_hire", "hire", "no_hire", "strong_no_hire"] as VoteValue[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => castVote(v)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors",
                            myVote?.vote === v
                              ? VOTE_COLORS[v]
                              : "border-surface-200 text-surface-500 hover:border-surface-300",
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
                          <span className="text-xs text-surface-700">{v.voterName}</span>
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
                    <p className="text-[11px] text-surface-400">No votes yet. Be the first to share your feedback.</p>
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

                <div className="border-t border-surface-100" />

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
                      <div className="absolute left-0 bottom-full mb-1 z-10 w-60 rounded-lg border border-surface-200 bg-white shadow-lg">
                        {filteredTeam.map((m) => (
                          <button
                            key={m.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-surface-50 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault(); // prevent blur
                              insertMention(m.name!);
                            }}
                          >
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[8px] font-bold text-surface-600">
                              {m.name!.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <span className="font-medium text-surface-800">{m.name}</span>
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
                      className="rounded-lg border border-surface-200 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-surface-800">
                            {note.authorName}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {TEAM_ROLE_LABELS[note.authorRole]}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-surface-400">
                          {formatRelativeTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-surface-600">
                        <RenderNoteContent content={note.content} />
                      </p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="py-6 text-center text-sm text-surface-400">
                      No notes yet
                    </p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* ── Footer actions ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-t border-surface-200 p-3 sm:p-4">
          {applicant.pipelineStage !== "hired" &&
            applicant.pipelineStage !== "rejected" && (
              <>
                {applicant.pipelineStage !== "applied" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGoBack(applicant.id)}
                    className="gap-1.5 text-surface-500 hover:text-surface-700"
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
                  Advance
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
