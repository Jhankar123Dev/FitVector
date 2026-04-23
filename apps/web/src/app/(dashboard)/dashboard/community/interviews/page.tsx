"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  Building2,
  Briefcase,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  DIFFICULTY_CONFIG,
  OUTCOME_CONFIG,
  type InterviewDifficulty,
  type InterviewOutcome,
  type InterviewExperience,
} from "@/types/community";
import { useCommunityPosts, useVote } from "@/hooks/use-community";

type SortOption = "recent" | "helpful" | "company";

export default function InterviewExperiencesPage() {
  const { data: postsData, isLoading } = useCommunityPosts("interview_experience");
  const experiences = (postsData?.data || []).map((post) => {
    const d = (post.interviewData as Record<string, unknown>) || {};
    return {
      id: post.id,
      companyName: d.companyName ?? post.title,
      role: d.role ?? "",
      difficulty: (d.difficulty as InterviewDifficulty) ?? "medium",
      outcome: (d.outcome as InterviewOutcome) ?? "in_progress",
      rounds: (d.rounds as InterviewExperience["rounds"]) ?? [],
      processDescription: (d.processDescription as string) ?? "",
      tips: (d.tips as string) ?? "",
      overallRating: (d.overallRating as number) ?? 0,
      upvotes: (post.upvotes as number) ?? 0,
      downvotes: (post.downvotes as number) ?? 0,
      isAnonymous: post.isAnonymous as boolean,
      authorName: (post.authorName as string) ?? null,
      userVote: (post.userVote as "up" | "down" | null) ?? null,
      createdAt: post.createdAt as string,
    } as InterviewExperience;
  });

  // Derive unique companies from live data for the header count
  const uniqueCompanyCount = useMemo(
    () => new Set(experiences.map((e) => e.companyName).filter(Boolean)).size,
    [experiences]
  );

  // Filters
  const [companySearch, setCompanySearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty | "all">("all");
  const [outcome, setOutcome] = useState<InterviewOutcome | "all">("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [localVotes, setLocalVotes] = useState<Record<string, "up" | "down" | null>>({});
  const { mutate: castVote } = useVote();

  const getUserVote = (exp: InterviewExperience) =>
    exp.id in localVotes ? localVotes[exp.id] : (exp.userVote ?? null);

  const handleVote = (exp: InterviewExperience, type: "up" | "down") => {
    const current = getUserVote(exp);
    const next = current === type ? null : type;
    setLocalVotes((prev) => ({ ...prev, [exp.id]: next }));
    castVote(
      { targetType: "post", targetId: exp.id, voteType: type },
      {
        onSuccess: (res) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setLocalVotes((prev) => ({ ...prev, [exp.id]: (res as any).data?.voteType ?? null }));
        },
        onError: () => {
          setLocalVotes((prev) => ({ ...prev, [exp.id]: current }));
        },
      }
    );
  };

  const filteredExperiences = useMemo(() => {
    let result = [...experiences];

    if (companySearch.trim()) {
      const q = companySearch.toLowerCase();
      result = result.filter((e) => e.companyName.toLowerCase().includes(q));
    }
    if (roleSearch.trim()) {
      const q = roleSearch.toLowerCase();
      result = result.filter((e) => e.role.toLowerCase().includes(q));
    }
    if (difficulty !== "all") {
      result = result.filter((e) => e.difficulty === difficulty);
    }
    if (outcome !== "all") {
      result = result.filter((e) => e.outcome === outcome);
    }

    switch (sort) {
      case "helpful":
        result.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "company":
        result.sort((a, b) => a.companyName.localeCompare(b.companyName));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [companySearch, roleSearch, difficulty, outcome, sort]);

  const handleVote = (id: string, type: "up" | "down") => {
    setVotes((prev) => ({
      ...prev,
      [id]: {
        up: (prev[id]?.up || 0) + (type === "up" ? 1 : 0),
        down: (prev[id]?.down || 0) + (type === "down" ? 1 : 0),
      },
    }));
  };

  const getVotes = (exp: InterviewExperience) => ({
    up: exp.upvotes,
    down: exp.downvotes,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/community"
            className="mb-2 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Community
          </Link>
          <h1 className="text-2xl font-semibold text-surface-800">Interview Experiences</h1>
          <p className="mt-1 text-sm text-surface-500">
            {filteredExperiences.length} anonymous experiences across {uniqueCompanyCount} companies
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Share Your Experience
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-3">
            {/* Company search */}
            <div className="relative w-full sm:w-44">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Company..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Role search */}
            <div className="relative w-full sm:w-40">
              <Briefcase className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Role..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Difficulty */}
            <div className="flex gap-1">
              {(["all", "easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    difficulty === d
                      ? "bg-brand-500 text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200",
                  )}
                >
                  {d === "all" ? "All" : DIFFICULTY_CONFIG[d].label}
                </button>
              ))}
            </div>

            {/* Outcome */}
            <div className="flex gap-1">
              {(["all", "got_offer", "rejected", "ghosted"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    outcome === o
                      ? "bg-brand-500 text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200",
                  )}
                >
                  {o === "all" ? "All" : OUTCOME_CONFIG[o].label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex gap-1 sm:ml-auto">
              {([
                { id: "recent", label: "Recent" },
                { id: "helpful", label: "Helpful" },
                { id: "company", label: "Company" },
              ] as const).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    sort === s.id
                      ? "bg-surface-800 text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Cards */}
      <div className="space-y-3">
        {filteredExperiences.map((exp) => {
          const isExpanded = expandedId === exp.id;
          const v = getVotes(exp);
          const userVote = getUserVote(exp);
          const diffConfig = DIFFICULTY_CONFIG[exp.difficulty];
          const outcomeConfig = OUTCOME_CONFIG[exp.outcome];

          return (
            <Card key={exp.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Collapsed View */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-surface-800">
                        <Building2 className="h-3.5 w-3.5 text-surface-400" />
                        {exp.companyName}
                      </span>
                      <span className="text-sm text-surface-500">·</span>
                      <span className="text-sm text-surface-600">{exp.role}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={cn("text-[10px]", diffConfig.bg, diffConfig.color)}>
                        {diffConfig.label}
                      </Badge>
                      <Badge className={cn("text-[10px]", outcomeConfig.bg, outcomeConfig.color)}>
                        {outcomeConfig.label}
                      </Badge>
                      <span className="text-xs text-surface-400">
                        {exp.rounds.length} round{exp.rounds.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-surface-400">·</span>
                      <span className="text-xs text-surface-400">
                        {formatRelativeTime(exp.createdAt)}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="mt-1.5 flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < exp.overallRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-surface-200",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={cn("flex items-center gap-1 text-xs", userVote === "up" ? "text-brand-600" : "text-surface-500")}>
                      <ThumbsUp className={cn("h-3 w-3", userVote === "up" && "fill-brand-500")} />
                      {v.up}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-surface-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-surface-400" />
                    )}
                  </div>
                </button>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="border-t border-surface-100 bg-surface-50/50 p-4 space-y-4">
                    {/* Author */}
                    <p className="text-xs text-surface-400">
                      By {exp.isAnonymous ? "Anonymous" : exp.authorName}
                    </p>

                    {/* Process Description */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Process
                      </h4>
                      <p className="mt-1 text-sm text-surface-700 whitespace-pre-wrap">
                        {exp.processDescription}
                      </p>
                    </div>

                    {/* Rounds */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Interview Rounds
                      </h4>
                      <div className="mt-2 space-y-3">
                        {exp.rounds.map((round) => (
                          <div key={round.roundNumber} className="rounded-lg border border-surface-200 bg-white p-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                                {round.roundNumber}
                              </span>
                              <span className="text-sm font-medium text-surface-700">
                                {round.type}
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 pl-7">
                              {(round.questions ?? []).map((q, i) => (
                                <li key={i} className="text-xs text-surface-600 before:content-['•'] before:mr-1.5 before:text-surface-400">
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    {exp.tips && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                          Tips
                        </h4>
                        <p className="mt-1 text-sm text-surface-700">{exp.tips}</p>
                      </div>
                    )}

                    {/* Votes */}
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-xs text-surface-400">Was this helpful?</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-7 gap-1 px-2 text-xs", userVote === "up" && "border-brand-500 bg-brand-50 text-brand-600")}
                        onClick={(e) => { e.stopPropagation(); handleVote(exp, "up"); }}
                      >
                        <ThumbsUp className={cn("h-3 w-3", userVote === "up" && "fill-brand-500")} />
                        {v.up}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-7 gap-1 px-2 text-xs", userVote === "down" && "border-red-400 bg-red-50 text-red-600")}
                        onClick={(e) => { e.stopPropagation(); handleVote(exp, "down"); }}
                      >
                        <ThumbsDown className={cn("h-3 w-3", userVote === "down" && "fill-red-500")} />
                        {v.down}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredExperiences.length === 0 && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-surface-300" />
            <p className="text-sm text-surface-500">No experiences match your filters</p>
          </div>
        )}
      </div>

      {/* Share Experience Modal */}
      {showModal && <ShareExperienceModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

// ─── Share Experience Modal ────────────────────────────────────────────────

function ShareExperienceModal({ onClose }: { onClose: () => void }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [diff, setDiff] = useState<InterviewDifficulty>("medium");
  const [outcomeVal, setOutcomeVal] = useState<InterviewOutcome>("got_offer");
  const [rounds, setRounds] = useState<{ type: string; questions: string }[]>([
    { type: "Phone Screen", questions: "" },
  ]);
  const [tips, setTips] = useState("");
  const [rating, setRating] = useState(3);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addRound = () => {
    setRounds((prev) => [...prev, { type: "Technical", questions: "" }]);
  };

  const updateRound = (i: number, field: "type" | "questions", value: string) => {
    setRounds((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const removeRound = (i: number) => {
    setRounds((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    if (!company.trim() || !role.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold text-surface-800">
            {submitted ? "Thanks for sharing!" : "Share Your Interview Experience"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-surface-600">
              Your experience has been submitted and will help other job seekers!
            </p>
            <Button size="sm" onClick={onClose} className="mt-4">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {/* Company + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Company *</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Role *</Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" className="mt-1" />
              </div>
            </div>

            {/* Difficulty + Outcome */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Difficulty</Label>
                <div className="mt-1 flex gap-1">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDiff(d)}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                        diff === d ? cn(DIFFICULTY_CONFIG[d].bg, DIFFICULTY_CONFIG[d].color, "ring-1 ring-current") : "bg-surface-100 text-surface-600",
                      )}
                    >
                      {DIFFICULTY_CONFIG[d].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Outcome</Label>
                <select
                  value={outcomeVal}
                  onChange={(e) => setOutcomeVal(e.target.value as InterviewOutcome)}
                  className="mt-1 w-full rounded-lg border border-surface-200 px-2 py-1.5 text-sm outline-none focus:border-brand-300"
                >
                  {(Object.keys(OUTCOME_CONFIG) as InterviewOutcome[]).map((o) => (
                    <option key={o} value={o}>{OUTCOME_CONFIG[o].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rounds */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Interview Rounds</Label>
                <Button variant="ghost" size="sm" onClick={addRound} className="h-6 gap-1 px-2 text-xs">
                  <Plus className="h-3 w-3" /> Add Round
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {rounds.map((round, i) => (
                  <div key={i} className="rounded-lg border border-surface-200 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-surface-400">R{i + 1}</span>
                      <select
                        value={round.type}
                        onChange={(e) => updateRound(i, "type", e.target.value)}
                        className="flex-1 rounded border border-surface-200 px-2 py-1 text-xs outline-none"
                      >
                        {["Phone Screen", "Technical", "System Design", "Take-home", "HR", "Culture Fit"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {rounds.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeRound(i)} className="h-6 w-6 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={round.questions}
                      onChange={(e) => updateRound(i, "questions", e.target.value)}
                      placeholder="Questions asked (one per line)..."
                      rows={2}
                      className="mt-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div>
              <Label className="text-xs">Tips for future candidates</Label>
              <Textarea value={tips} onChange={(e) => setTips(e.target.value)} rows={2} className="mt-1 text-sm" placeholder="What advice would you give?" />
            </div>

            {/* Rating */}
            <div>
              <Label className="text-xs">Overall Rating</Label>
              <div className="mt-1 flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button key={i} onClick={() => setRating(i + 1)}>
                    <Star className={cn("h-5 w-5", i < rating ? "fill-amber-400 text-amber-400" : "text-surface-200")} />
                  </button>
                ))}
              </div>
            </div>

            {/* Anonymous */}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
              Post anonymously
            </label>

            {/* Submit */}
            <Button onClick={handleSubmit} disabled={submitting || !company.trim() || !role.trim()} className="w-full gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Submitting..." : "Submit Experience"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
