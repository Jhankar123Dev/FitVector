"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Mail,
  MessageSquare,
  UserPlus,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutreachEntry {
  id: string;
  outreachType: "cold_email" | "linkedin_message" | "referral_request";
  subject: string | null;
  body: string;
  tone: string;
  recruiterName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  createdAt: string;
}

interface JobGroup {
  key: string;
  jobTitle: string | null;
  companyName: string | null;
  entries: OutreachEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTREACH_TYPES = [
  "cold_email",
  "linkedin_message",
  "referral_request",
] as const;

type OutreachType = (typeof OUTREACH_TYPES)[number];

const TYPE_META: Record<
  OutreachType,
  { icon: React.ElementType; label: string; badgeClass: string }
> = {
  cold_email: {
    icon: Mail,
    label: "Cold Email",
    badgeClass: "bg-brand-50 text-brand-700 border-brand-200",
  },
  linkedin_message: {
    icon: MessageSquare,
    label: "LinkedIn InMail",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  referral_request: {
    icon: UserPlus,
    label: "Referral Request",
    badgeClass: "bg-accent-50 text-accent-700 border-accent-200",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function groupByJob(entries: OutreachEntry[]): JobGroup[] {
  const map = new Map<string, JobGroup>();

  for (const entry of entries) {
    // Normalise key so "  google  " and "Google" don't create two groups
    const titleKey = (entry.jobTitle || "").trim().toLowerCase();
    const companyKey = (entry.companyName || "").trim().toLowerCase();
    const key = `${titleKey}|||${companyKey}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        jobTitle: entry.jobTitle?.trim() || null,
        companyName: entry.companyName?.trim() || null,
        entries: [],
      });
    }
    map.get(key)!.entries.push(entry);
  }

  // Sort groups newest-first (by their most recent entry)
  return Array.from(map.values()).sort((a, b) => {
    const aLatest = Math.max(
      ...a.entries.map((e) => new Date(e.createdAt).getTime()),
    );
    const bLatest = Math.max(
      ...b.entries.map((e) => new Date(e.createdAt).getTime()),
    );
    return bLatest - aLatest;
  });
}

// ─── Small atoms ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-muted-foreground/70 hover:text-foreground/80"
      title="Copy to clipboard"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-accent-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// ─── MessageItem ──────────────────────────────────────────────────────────────

function MessageItem({
  entry,
  onDelete,
  isDeleting,
}: {
  entry: OutreachEntry;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const copyText = entry.subject
    ? `${entry.subject}\n\n${entry.body}`
    : entry.body;

  return (
    <div className="rounded-md border border-border bg-muted p-3">
      {entry.subject && (
        <p className="mb-1 truncate text-xs font-medium text-foreground/80">
          {entry.subject}
        </p>
      )}
      {entry.recruiterName && (
        <p className="mb-1 text-[10px] text-muted-foreground/70">
          to {entry.recruiterName}
        </p>
      )}
      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {entry.body}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/70">
          {formatDate(entry.createdAt)}
        </span>
        <div className="flex items-center gap-0.5">
          <CopyBtn text={copyText} />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-red-500"
            title="Delete this version"
            onClick={() => onDelete(entry.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── OutreachTypeSlot ─────────────────────────────────────────────────────────

function OutreachTypeSlot({
  type,
  messages,
  onDelete,
  deletingId,
}: {
  type: OutreachType;
  messages: OutreachEntry[]; // already sorted newest-first
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const [showOlder, setShowOlder] = useState(false);
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  const latest = messages[0];
  const older = messages.slice(1);

  return (
    <div className="space-y-2">
      {/* Slot header */}
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
        <span className="text-xs font-semibold text-muted-foreground">
          {meta.label}
        </span>
        {messages.length > 1 && (
          <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {messages.length} versions
          </span>
        )}
      </div>

      {/* Slot content */}
      {messages.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground/70">
          Not generated yet
        </p>
      ) : (
        <>
          {/* Latest (always visible) */}
          <MessageItem
            entry={latest}
            onDelete={onDelete}
            isDeleting={deletingId === latest.id}
          />

          {/* Older versions collapsible */}
          {older.length > 0 && (
            <>
              <button
                onClick={() => setShowOlder((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/70 transition-colors hover:text-muted-foreground"
              >
                {showOlder ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {showOlder ? "Hide" : `Show ${older.length} older`} version
                {older.length > 1 ? "s" : ""}
              </button>

              {showOlder && (
                <div className="space-y-2">
                  {older.map((entry) => (
                    <MessageItem
                      key={entry.id}
                      entry={entry}
                      onDelete={onDelete}
                      isDeleting={deletingId === entry.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── JobGroupCard ─────────────────────────────────────────────────────────────

function JobGroupCard({
  group,
  onDelete,
  deletingId,
}: {
  group: JobGroup;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const hasJobContext = group.jobTitle || group.companyName;
  const totalCount = group.entries.length;

  return (
    <Card className="overflow-hidden">
      {/* Card header — job identity */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          <div className="min-w-0">
            {hasJobContext ? (
              <p className="truncate text-sm font-semibold text-foreground">
                {group.jobTitle || "Unknown Role"}
                {group.companyName && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    @ {group.companyName}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground/70">No job context</p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className="ml-3 shrink-0 text-[10px] text-muted-foreground"
        >
          {totalCount} message{totalCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Three outreach type slots */}
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {OUTREACH_TYPES.map((type) => {
            const typeMessages = group.entries
              .filter((e) => e.outreachType === type)
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );

            return (
              <div key={type} className="p-4">
                <OutreachTypeSlot
                  type={type}
                  messages={typeMessages}
                  onDelete={onDelete}
                  deletingId={deletingId}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutreachPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<OutreachEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;

  const { isLoading } = useQuery({
    queryKey: ["outreach-history", 0],
    queryFn: async () => {
      const res = await fetch(`/api/outreach?offset=0&limit=${LIMIT}`);
      if (!res.ok) return null;
      const json = await res.json() as { data?: OutreachEntry[]; total?: number; hasMore?: boolean };
      setAllEntries(json.data || []);
      setTotal(json.total ?? 0);
      setHasMore(json.hasMore ?? false);
      setOffset(LIMIT);
      return json;
    },
  });

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/outreach?offset=${offset}&limit=${LIMIT}`);
      if (!res.ok) return;
      const json = await res.json() as { data?: OutreachEntry[]; total?: number; hasMore?: boolean };
      setAllEntries((prev) => [...prev, ...(json.data || [])]);
      setTotal(json.total ?? total);
      setHasMore(json.hasMore ?? false);
      setOffset((prev) => prev + LIMIT);
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/outreach/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: (_, deletedId) => {
      setAllEntries((prev) => prev.filter((e) => e.id !== deletedId));
      setTotal((prev) => Math.max(0, prev - 1));
      queryClient.invalidateQueries({ queryKey: ["outreach-history"] });
    },
  });

  const groups = groupByJob(allEntries);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Outreach History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your generated messages, grouped by job
          </p>
        </div>
        {total > 0 && (
          <Badge variant="outline" className="mt-1 shrink-0 text-xs text-muted-foreground">
            {allEntries.length} of {total}
          </Badge>
        )}
      </div>

      {isLoading && <LoadingSpinner message="Loading outreach history..." />}

      {!isLoading && groups.length === 0 && (
        <EmptyState
          icon={Mail}
          title="No outreach messages yet"
          description="Generate cold emails, LinkedIn messages, or referral requests from any job in the Jobs tab."
        />
      )}

      {groups.length > 0 && (
        <div className="space-y-4">
          {groups.map((group) => (
            <JobGroupCard
              key={group.key}
              group={group}
              onDelete={(id) => deleteMutation.mutate(id)}
              deletingId={deletingId}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...</>
                ) : (
                  <>Load more messages</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
