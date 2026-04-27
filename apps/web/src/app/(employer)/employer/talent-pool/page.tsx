"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Database,
  Search,
  Send,
  X,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  Filter,
  Crosshair,
  Clock,
  Loader2,
  CheckCircle2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { useTalentPool, useUpdateTags, useReengage, useTalentPoolSearch } from "@/hooks/use-talent-pool";
import type { TalentPoolSearchCandidate, TalentPoolSearchResult } from "@/hooks/use-talent-pool";
import { useEmployerJobs } from "@/hooks/use-employer-jobs";
import type { TalentPoolCandidate } from "@/types/employer";
import { SOURCE_LABELS } from "@/types/employer";

// ── Tag colors (rotating) ───────────────────────────────────────────
const TAG_COLORS = [
  "bg-brand-50 text-brand-700 border-brand-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-violet-50 text-violet-700 border-violet-200",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// ── Score color ─────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 60) return "bg-brand-50 text-brand-700";
  if (score >= 40) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export default function TalentPoolPage() {
  const { data: talentData, isLoading } = useTalentPool();
  const { data: jobsData } = useEmployerJobs();
  const updateTags = useUpdateTags();
  const reengage = useReengage();
  const talentSearch = useTalentPoolSearch();

  const candidates = (talentData?.data || []) as unknown as TalentPoolCandidate[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MOCK_JOB_POSTS = (jobsData?.data || []) as any[];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [reengageCandidate, setReengageCandidate] = useState<TalentPoolCandidate | null>(null);
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  // ── Find Matches state ──────────────────────────────────────────
  const [matchJobPostId, setMatchJobPostId] = useState("");
  const [matchMaxCandidates, setMatchMaxCandidates] = useState(20);
  const [matchLastActive, setMatchLastActive] = useState("");
  const [matchSkills, setMatchSkills] = useState("");
  const [matchLocation, setMatchLocation] = useState("");

  function handleFindMatches() {
    if (!matchJobPostId) return;
    talentSearch.mutate({
      jobPostId: matchJobPostId,
      maxCandidates: matchMaxCandidates,
      ...(matchLastActive ? { lastActiveAfter: new Date(matchLastActive).toISOString() } : {}),
      ...(matchSkills.trim() ? { skills: matchSkills.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
      ...(matchLocation.trim() ? { location: matchLocation.trim() } : {}),
    });
  }

  function getCacheAgeMinutes(cachedAt: string): number {
    return Math.round((Date.now() - new Date(cachedAt).getTime()) / 60000);
  }

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    candidates.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [candidates]);

  // Suggestion banner: match talent pool skills with active jobs
  const matchingSuggestion = useMemo(() => {
    const activeJobs = MOCK_JOB_POSTS.filter((j) => j.status === "active");
    for (const job of activeJobs) {
      const matching = candidates.filter((c) =>
        c.skills.some((s: string) => (job.requiredSkills || []).some((rs: string) => rs.toLowerCase() === s.toLowerCase())),
      );
      if (matching.length >= 2) {
        return { job, count: matching.length };
      }
    }
    return null;
  }, [candidates]);

  // Filter candidates
  const filtered = useMemo(() => {
    let result = candidates;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.skills.some((s) => s.toLowerCase().includes(term)),
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((c) => selectedTags.some((t) => c.tags.includes(t)));
    }

    if (scoreFilter === "80+") result = result.filter((c) => c.score >= 80);
    else if (scoreFilter === "60-80") result = result.filter((c) => c.score >= 60 && c.score < 80);
    else if (scoreFilter === "<60") result = result.filter((c) => c.score < 60);

    return result;
  }, [candidates, searchTerm, selectedTags, scoreFilter]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function removeCandidate(_id: string) {
    // Future: remove from talent pool via API
  }

  function addTagToCandidate(id: string) {
    if (!newTag.trim()) return;
    const candidate = candidates.find((c: TalentPoolCandidate) => c.id === id);
    if (candidate && !candidate.tags.includes(newTag.trim())) {
      updateTags.mutate({ id, tags: [...candidate.tags, newTag.trim()] });
    }
    setNewTag("");
    setAddingTagFor(null);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Talent Pool
          </h1>
          <Badge className="text-[11px] bg-brand-50 text-brand-700 border-brand-200">
            {candidates.length} candidates
          </Badge>
        </div>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          Candidates saved for future opportunities
        </p>
      </div>

      {/* ── Find Matches section ────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Find Matches for a Job
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Job post selector */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs text-muted-foreground">Job Post</Label>
              <select
                value={matchJobPostId}
                onChange={(e) => setMatchJobPostId(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              >
                <option value="">Select a job post...</option>
                {MOCK_JOB_POSTS.filter((j) => j.status === "active" || j.status === "draft").map(
                  (job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Max candidates */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max Candidates</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={matchMaxCandidates}
                onChange={(e) => setMatchMaxCandidates(Math.min(100, Math.max(1, Number(e.target.value) || 20)))}
                className="text-sm"
              />
            </div>

            {/* Last active date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Last Active After</Label>
              <Input
                type="date"
                value={matchLastActive}
                onChange={(e) => setMatchLastActive(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Skills filter */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs text-muted-foreground">Skills (comma-separated)</Label>
              <Input
                placeholder="e.g. React, Node.js, Python"
                value={matchSkills}
                onChange={(e) => setMatchSkills(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Location filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input
                placeholder="e.g. Bangalore"
                value={matchLocation}
                onChange={(e) => setMatchLocation(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Search button */}
            <div className="flex items-end">
              <Button
                onClick={handleFindMatches}
                disabled={!matchJobPostId || talentSearch.isPending}
                className="w-full gap-2"
              >
                {talentSearch.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
                Find Matches for This Job
              </Button>
            </div>
          </div>

          {/* Error */}
          {talentSearch.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {talentSearch.error.message || "Search failed. Please try again."}
            </div>
          )}

          {/* Results */}
          {talentSearch.data && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-foreground">
                    {talentSearch.data.data.length} matching candidate{talentSearch.data.data.length !== 1 ? "s" : ""} found
                  </span>
                </div>
                {talentSearch.data.cached && talentSearch.data.cachedAt && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    Cached from {getCacheAgeMinutes(talentSearch.data.cachedAt)} min ago
                  </div>
                )}
              </div>

              {talentSearch.data.data.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/30 py-8 text-center">
                  <Database className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No matching candidates found</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">Try broadening your filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground">Candidate</th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground">Matching Skills</th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground">Match</th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground">Score</th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground">Location</th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground">Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {talentSearch.data.data.map((c: TalentPoolSearchCandidate) => (
                        <tr key={c.id} className="border-b border-border transition-colors hover:bg-muted/30">
                          <td className="px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground">{c.name}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{c.email}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {c.matchingSkills.slice(0, 4).map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200"
                                >
                                  {skill}
                                </span>
                              ))}
                              {c.matchingSkills.length > 4 && (
                                <span className="text-[10px] text-muted-foreground/70">
                                  +{c.matchingSkills.length - 4}
                                </span>
                              )}
                              {c.matchingSkills.length === 0 && (
                                <span className="text-[10px] text-muted-foreground/70 italic">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold",
                                c.matchScore >= 70
                                  ? "bg-emerald-50 text-emerald-700"
                                  : c.matchScore >= 40
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-700",
                              )}
                            >
                              {c.matchScore}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold", getScoreColor(c.screeningScore))}>
                              {c.screeningScore}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {c.location ? (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                {c.location}
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/70 italic">N/A</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {c.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-medium", getTagColor(tag))}
                                >
                                  {tag}
                                </span>
                              ))}
                              {c.tags.length > 3 && (
                                <span className="text-[9px] text-muted-foreground/70">+{c.tags.length - 3}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Suggestion banner ─────────────────────────────────── */}
      {matchingSuggestion && (
        <Card className="border-brand-200 bg-brand-50/50">
          <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600 shrink-0" />
              <p className="text-xs sm:text-sm text-brand-700">
                <strong>{matchingSuggestion.count} candidates</strong> in your talent pool match{" "}
                <strong>{matchingSuggestion.job.title}</strong>
              </p>
            </div>
            <Button size="sm" className="gap-1 text-xs w-full sm:w-auto">
              View Matches
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Filters bar ───────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          {/* Search + score filter row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="Search by name, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
              {[
                { value: "all", label: "All" },
                { value: "80+", label: "80+" },
                { value: "60-80", label: "60-80" },
                { value: "<60", label: "<60" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScoreFilter(opt.value)}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    scoreFilter === opt.value
                      ? "bg-brand-500 text-white"
                      : "bg-white text-muted-foreground hover:bg-muted/30",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-3 w-3 text-muted-foreground/70 shrink-0" />
            <span className="text-[11px] text-muted-foreground shrink-0">Tags:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  selectedTags.includes(tag)
                    ? "bg-brand-500 text-white border-brand-500"
                    : cn("hover:opacity-80", getTagColor(tag)),
                )}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-[10px] text-muted-foreground/70 hover:text-muted-foreground underline"
              >
                Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Candidates table ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <Database className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No candidates found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try adjusting your filters or search term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground">Candidate</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground">Skills</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground">Last Role</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground">Score</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground">Added</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground">Tags</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    onReengage={() => setReengageCandidate(candidate)}
                    onRemove={() => removeCandidate(candidate.id)}
                    onTagClick={toggleTag}
                    addingTag={addingTagFor === candidate.id}
                    onStartAddTag={() => setAddingTagFor(candidate.id)}
                    onCancelAddTag={() => { setAddingTagFor(null); setNewTag(""); }}
                    newTag={newTag}
                    onNewTagChange={setNewTag}
                    onAddTag={() => addTagToCandidate(candidate.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Re-engage modal ───────────────────────────────────── */}
      {reengageCandidate && (
        <ReengageModal
          candidate={reengageCandidate}
          onClose={() => setReengageCandidate(null)}
        />
      )}
    </div>
  );
}

// ── Candidate table row ─────────────────────────────────────────────
function CandidateRow({
  candidate,
  onReengage,
  onRemove,
  onTagClick,
  addingTag,
  onStartAddTag,
  onCancelAddTag,
  newTag,
  onNewTagChange,
  onAddTag,
}: {
  candidate: TalentPoolCandidate;
  onReengage: () => void;
  onRemove: () => void;
  onTagClick: (tag: string) => void;
  addingTag: boolean;
  onStartAddTag: () => void;
  onCancelAddTag: () => void;
  newTag: string;
  onNewTagChange: (v: string) => void;
  onAddTag: () => void;
}) {
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/30">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] sm:text-xs font-semibold text-muted-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs sm:text-sm font-medium text-foreground">{candidate.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{candidate.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {candidate.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="text-[10px] text-muted-foreground/70">+{candidate.skills.length - 3}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-foreground/80">{candidate.lastAppliedRole}</span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold", getScoreColor(candidate.score))}>
          {candidate.score}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(candidate.dateAdded)}</span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
          {candidate.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-medium hover:opacity-80", getTagColor(tag))}
            >
              {tag}
            </button>
          ))}
          {addingTag ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onAddTag(); if (e.key === "Escape") onCancelAddTag(); }}
                placeholder="tag..."
                className="w-16 rounded border border-border px-1 py-0.5 text-[10px] outline-none focus:border-brand-400"
                autoFocus
              />
              <button onClick={onAddTag} className="text-emerald-500 hover:text-emerald-700">
                <Plus className="h-3 w-3" />
              </button>
              <button onClick={onCancelAddTag} className="text-muted-foreground/70 hover:text-muted-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onStartAddTag}
              className="rounded-full border border-dashed border-border/60 px-1.5 py-0.5 text-[9px] text-muted-foreground/70 hover:border-border/60 hover:text-muted-foreground"
            >
              + tag
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={onReengage}
          >
            <Send className="h-3 w-3" />
            Re-engage
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ── Re-engage modal ─────────────────────────────────────────────────
function ReengageModal({
  candidate,
  onClose,
}: {
  candidate: TalentPoolCandidate;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(
    "We have a new role that might interest you!",
  );
  const [body, setBody] = useState(
    `Hi ${candidate.name},\n\nWe hope you're doing well! We really enjoyed connecting with you when you applied for the ${candidate.lastAppliedRole} position.\n\nWe have a new opportunity that we think could be a great fit for your skills and experience. Would you be open to hearing more about it?\n\nLooking forward to reconnecting!\n\nBest regards,\nTechStartup Inc Hiring Team`,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Re-engage Candidate</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">To:</p>
            <p className="text-sm font-medium text-foreground">{candidate.name} &lt;{candidate.email}&gt;</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="text-xs leading-relaxed"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 gap-1.5" onClick={onClose}>
              <Send className="h-3.5 w-3.5" />
              Send Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
