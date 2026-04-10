"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  ThumbsUp,
  MessageSquare,
  ArrowLeft,
  X,
  ChevronDown,
  ChevronUp,
  Reply,
  Loader2,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  CATEGORY_CONFIG,
  CATEGORY_IDS,
  type DiscussionCategory,
  type DiscussionThread,
  type DiscussionReply,
} from "@/types/community";
import { useCommunityPosts, useCommunityPost } from "@/hooks/use-community";

type SortOption = "hot" | "new" | "top";

export default function DiscussionsPage() {
  const { data: postsData } = useCommunityPosts("discussion");
  const threads = (postsData?.data || []) as unknown as DiscussionThread[];

  const [category, setCategory] = useState<DiscussionCategory | "all">("all");
  const [sort, setSort] = useState<SortOption>("hot");
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);

  // Fetch live replies when a thread is expanded
  const { data: expandedPostData } = useCommunityPost(expandedThreadId);
  const [showNewModal, setShowNewModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [threadUpvotes, setThreadUpvotes] = useState<Record<string, number>>({});
  const [replyUpvotes, setReplyUpvotes] = useState<Record<string, number>>({});

  const filteredThreads = useMemo(() => {
    let result = [...threads];

    if (category !== "all") {
      result = result.filter((t) => t.category === category);
    }

    switch (sort) {
      case "hot":
        result.sort((a, b) => {
          const scoreA = a.upvotes + a.repliesCount * 2;
          const scoreB = b.upvotes + b.repliesCount * 2;
          return scoreB - scoreA;
        });
        break;
      case "new":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "top":
        result.sort((a, b) => b.upvotes - a.upvotes);
        break;
    }

    return result;
  }, [category, sort]);

  // Replies come from the live API when a thread is expanded
  const getRepliesForThread = (_threadId: string): DiscussionReply[] =>
    ((expandedPostData?.data as Record<string, unknown>)?.comments as DiscussionReply[]) ?? [];

  const getUpvotes = (id: string, base: number, store: Record<string, number>) =>
    base + (store[id] || 0);

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
          <h1 className="text-2xl font-semibold text-surface-800">Discussions</h1>
          <p className="mt-1 text-sm text-surface-500">
            {filteredThreads.length} threads · Join the conversation
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Discussion
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as DiscussionCategory | "all")}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {CATEGORY_IDS.map((c) => (
            <TabsTrigger key={c} value={c} className="text-xs">
              {CATEGORY_CONFIG[c].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Sort */}
      <div className="flex gap-1">
        {(["hot", "new", "top"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              sort === s
                ? "bg-surface-800 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Thread List */}
      <div className="space-y-2">
        {filteredThreads.map((thread) => {
          const isExpanded = expandedThreadId === thread.id;
          const catConfig = CATEGORY_CONFIG[thread.category];
          const replies = getRepliesForThread(thread.id);
          const topReplies = replies.filter((r) => !r.parentReplyId);

          return (
            <Card key={thread.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Thread Row */}
                <button
                  onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-50"
                >
                  {/* Upvote column */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThreadUpvotes((prev) => ({ ...prev, [thread.id]: (prev[thread.id] || 0) + 1 }));
                      }}
                    >
                      <ThumbsUp className="h-3 w-3 text-surface-400" />
                    </Button>
                    <span className="text-xs font-medium text-surface-600">
                      {getUpvotes(thread.id, thread.upvotes, threadUpvotes)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px]", catConfig.bg, catConfig.color)}>
                        {catConfig.label}
                      </Badge>
                      <h3 className="text-sm font-medium text-surface-800 line-clamp-1">
                        {thread.title}
                      </h3>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-surface-400">
                      <span className="flex items-center gap-0.5">
                        <User className="h-2.5 w-2.5" />
                        {thread.isAnonymous ? "Anonymous" : thread.authorName}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {thread.repliesCount} replies
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(thread.lastActivityAt)}
                      </span>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-surface-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-surface-400" />
                  )}
                </button>

                {/* Expanded Thread Detail */}
                {isExpanded && (
                  <div className="border-t border-surface-100 bg-surface-50/50 p-4 space-y-4">
                    {/* Thread body */}
                    <div className="rounded-lg bg-white p-3 border border-surface-200">
                      <p className="text-sm text-surface-700 whitespace-pre-wrap">
                        {thread.body}
                      </p>
                      <p className="mt-2 text-xs text-surface-400">
                        Posted {formatRelativeTime(thread.createdAt)} by{" "}
                        {thread.isAnonymous ? "Anonymous" : thread.authorName}
                      </p>
                    </div>

                    {/* Replies */}
                    {topReplies.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                          Replies ({replies.length})
                        </h4>
                        {topReplies.map((reply) => {
                          const nested = replies.filter((r) => r.parentReplyId === reply.id);
                          return (
                            <div key={reply.id} className="space-y-2">
                              {/* Top-level reply */}
                              <ReplyCard
                                reply={reply}
                                upvotes={getUpvotes(reply.id, reply.upvotes, replyUpvotes)}
                                onUpvote={() => setReplyUpvotes((prev) => ({ ...prev, [reply.id]: (prev[reply.id] || 0) + 1 }))}
                                onReply={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                              />

                              {/* Nested replies */}
                              {nested.map((nr) => (
                                <div key={nr.id} className="ml-6">
                                  <ReplyCard
                                    reply={nr}
                                    upvotes={getUpvotes(nr.id, nr.upvotes, replyUpvotes)}
                                    onUpvote={() => setReplyUpvotes((prev) => ({ ...prev, [nr.id]: (prev[nr.id] || 0) + 1 }))}
                                    onReply={() => {}}
                                    isNested
                                  />
                                </div>
                              ))}

                              {/* Reply input */}
                              {replyingTo === reply.id && (
                                <div className="ml-6 flex gap-2">
                                  <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    rows={2}
                                    className="text-xs flex-1"
                                  />
                                  <div className="flex flex-col gap-1">
                                    <Button size="sm" className="h-7 text-xs" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                                      Post
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReplyingTo(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reply to thread */}
                    <div className="flex gap-2 border-t border-surface-200 pt-3">
                      <Textarea
                        placeholder="Reply to this thread..."
                        rows={2}
                        className="text-sm flex-1"
                      />
                      <Button size="sm" className="self-end">Reply</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredThreads.length === 0 && (
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-surface-300" />
            <p className="text-sm text-surface-500">No threads in this category yet</p>
          </div>
        )}
      </div>

      {/* New Discussion Modal */}
      {showNewModal && <NewDiscussionModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}

// ─── Reply Card ────────────────────────────────────────────────────────────

function ReplyCard({
  reply,
  upvotes,
  onUpvote,
  onReply,
  isNested = false,
}: {
  reply: DiscussionReply;
  upvotes: number;
  onUpvote: () => void;
  onReply: () => void;
  isNested?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-surface-200 bg-white p-3", isNested && "border-surface-150")}>
      <p className="text-sm text-surface-700">{reply.body}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
        <span>{reply.isAnonymous ? "Anonymous" : reply.authorName}</span>
        <span>{formatRelativeTime(reply.createdAt)}</span>
        <button onClick={onUpvote} className="flex items-center gap-0.5 hover:text-brand-600">
          <ThumbsUp className="h-2.5 w-2.5" />
          {upvotes}
        </button>
        {!isNested && (
          <button onClick={onReply} className="flex items-center gap-0.5 hover:text-brand-600">
            <Reply className="h-2.5 w-2.5" />
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

// ─── New Discussion Modal ──────────────────────────────────────────────────

function NewDiscussionModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<DiscussionCategory>("tech");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return;
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
            {submitted ? "Discussion Posted!" : "New Discussion"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-surface-600">Your discussion has been posted!</p>
            <Button size="sm" onClick={onClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on your mind?" className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">Category</Label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value as DiscussionCategory)}
                className="mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
              >
                {CATEGORY_IDS.map((c) => (
                  <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Body *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="mt-1 text-sm"
                placeholder="Share your thoughts, ask a question, or start a debate..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
              Post anonymously
            </label>

            <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !body.trim()} className="w-full gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Posting..." : "Post Discussion"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
