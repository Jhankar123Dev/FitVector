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
import { useCommunityPosts, useCommunityPost, useAddComment, useCreatePost, useVote } from "@/hooks/use-community";

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
  const [localVotes, setLocalVotes] = useState<Record<string, "up" | "down" | null>>({});
  const { mutate: castVote } = useVote();

  const getThreadVote = (thread: DiscussionThread) =>
    thread.id in localVotes ? localVotes[thread.id] : (thread.userVote ?? null);

  const handleThreadVote = (thread: DiscussionThread, type: "up" | "down") => {
    const current = getThreadVote(thread);
    const next = current === type ? null : type;
    setLocalVotes((prev) => ({ ...prev, [thread.id]: next }));
    castVote(
      { targetType: "post", targetId: thread.id, voteType: type },
      {
        onSuccess: (res) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setLocalVotes((prev) => ({ ...prev, [thread.id]: (res as any).data?.voteType ?? null }));
        },
        onError: () => {
          setLocalVotes((prev) => ({ ...prev, [thread.id]: current }));
        },
      }
    );
  };
  const [threadReplyText, setThreadReplyText] = useState("");
  const [threadReplyAnon, setThreadReplyAnon] = useState(false);
  const [replyAnon, setReplyAnon] = useState(false);
  const { mutate: addComment, isPending: addingComment } = useAddComment();

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
  }, [threads, category, sort]);

  // Replies come from the live API when a thread is expanded
  const getRepliesForThread = (_threadId: string): DiscussionReply[] =>
    ((expandedPostData?.data as Record<string, unknown>)?.comments as DiscussionReply[]) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/community"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Community
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Discussions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
                ? "bg-foreground text-white"
                : "bg-muted text-muted-foreground hover:bg-muted",
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
          const threadVote = getThreadVote(thread);

          return (
            <Card key={thread.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Thread Row */}
                <button
                  onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                >
                  {/* Upvote column */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThreadVote(thread, "up");
                      }}
                    >
                      <ThumbsUp className={cn("h-3 w-3", threadVote === "up" ? "fill-brand-500 text-brand-600" : "text-muted-foreground/70")} />
                    </Button>
                    <span className={cn("text-xs font-medium", threadVote === "up" ? "text-brand-600" : "text-muted-foreground")}>
                      {thread.upvotes}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px]", catConfig.bg, catConfig.color)}>
                        {catConfig.label}
                      </Badge>
                      <h3 className="text-sm font-medium text-foreground line-clamp-1">
                        {thread.title}
                      </h3>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground/70">
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
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  )}
                </button>

                {/* Expanded Thread Detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                    {/* Thread body */}
                    <div className="rounded-lg bg-card p-3 border border-border">
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                        {thread.body}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Posted {formatRelativeTime(thread.createdAt)} by{" "}
                        {thread.isAnonymous ? "Anonymous" : thread.authorName}
                      </p>
                    </div>

                    {/* Replies */}
                    {topReplies.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Replies ({replies.length})
                        </h4>
                        {topReplies.map((reply) => {
                          const nested = replies.filter((r) => r.parentReplyId === reply.id);
                          const replyVote = reply.id in localVotes ? localVotes[reply.id] : (reply.userVote ?? null);
                          return (
                            <div key={reply.id} className="space-y-2">
                              {/* Top-level reply */}
                              <ReplyCard
                                reply={reply}
                                upvotes={reply.upvotes}
                                userVote={replyVote}
                                onUpvote={() => {
                                  const current = replyVote;
                                  const next = current === "up" ? null : "up";
                                  setLocalVotes((prev) => ({ ...prev, [reply.id]: next }));
                                  castVote(
                                    { targetType: "comment", targetId: reply.id, voteType: "up" },
                                    {
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      onSuccess: (res) => setLocalVotes((prev) => ({ ...prev, [reply.id]: (res as any).data?.voteType ?? null })),
                                      onError: () => setLocalVotes((prev) => ({ ...prev, [reply.id]: current })),
                                    }
                                  );
                                }}
                                onReply={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                              />

                              {/* Nested replies */}
                              {nested.map((nr) => {
                                const nrVote = nr.id in localVotes ? localVotes[nr.id] : (nr.userVote ?? null);
                                return (
                                  <div key={nr.id} className="ml-6">
                                    <ReplyCard
                                      reply={nr}
                                      upvotes={nr.upvotes}
                                      userVote={nrVote}
                                      onUpvote={() => {
                                        const current = nrVote;
                                        const next = current === "up" ? null : "up";
                                        setLocalVotes((prev) => ({ ...prev, [nr.id]: next }));
                                        castVote(
                                          { targetType: "comment", targetId: nr.id, voteType: "up" },
                                          {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onSuccess: (res) => setLocalVotes((prev) => ({ ...prev, [nr.id]: (res as any).data?.voteType ?? null })),
                                            onError: () => setLocalVotes((prev) => ({ ...prev, [nr.id]: current })),
                                          }
                                        );
                                      }}
                                      onReply={() => {}}
                                      isNested
                                    />
                                  </div>
                                );
                              })}

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
                                  <div className="flex flex-col gap-1 items-end">
                                    <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={replyAnon}
                                        onChange={(e) => setReplyAnon(e.target.checked)}
                                        className="rounded"
                                      />
                                      Anon
                                    </label>
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs"
                                      disabled={addingComment || !replyText.trim()}
                                      onClick={() =>
                                        addComment(
                                          { postId: expandedThreadId!, body: replyText, isAnonymous: replyAnon },
                                          { onSuccess: () => { setReplyingTo(null); setReplyText(""); setReplyAnon(false); } }
                                        )
                                      }
                                    >
                                      {addingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post"}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setReplyingTo(null); setReplyAnon(false); }}>
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
                    <div className="flex gap-2 border-t border-border pt-3">
                      <Textarea
                        value={threadReplyText}
                        onChange={(e) => setThreadReplyText(e.target.value)}
                        placeholder="Reply to this thread..."
                        rows={2}
                        className="text-sm flex-1"
                      />
                      <div className="flex flex-col gap-1 items-end">
                        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={threadReplyAnon}
                            onChange={(e) => setThreadReplyAnon(e.target.checked)}
                            className="rounded"
                          />
                          Anon
                        </label>
                        <Button
                          size="sm"
                          className="self-end"
                          disabled={addingComment || !threadReplyText.trim()}
                          onClick={() =>
                            addComment(
                              { postId: thread.id, body: threadReplyText, isAnonymous: threadReplyAnon },
                              { onSuccess: () => { setThreadReplyText(""); setThreadReplyAnon(false); } }
                            )
                          }
                        >
                          {addingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reply"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredThreads.length === 0 && (
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No threads in this category yet</p>
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
  userVote,
  onUpvote,
  onReply,
  isNested = false,
}: {
  reply: DiscussionReply;
  upvotes: number;
  userVote: "up" | "down" | null;
  onUpvote: () => void;
  onReply: () => void;
  isNested?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3", isNested && "border-border")}>
      <p className="text-sm text-foreground/80">{reply.body}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/70">
        <span>{reply.isAnonymous ? "Anonymous" : reply.authorName}</span>
        <span>{formatRelativeTime(reply.createdAt)}</span>
        <button onClick={onUpvote} className={cn("flex items-center gap-0.5", userVote === "up" ? "text-brand-600" : "hover:text-brand-600")}>
          <ThumbsUp className={cn("h-2.5 w-2.5", userVote === "up" && "fill-brand-500")} />
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
  const [submitted, setSubmitted] = useState(false);
  const { mutate: createPost, isPending: submitting } = useCreatePost();

  const handleSubmit = () => {
    if (!title.trim() || body.length < 10) return;
    createPost(
      { title, body, postType: "discussion", category: cat, isAnonymous },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold text-foreground">
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
            <p className="text-sm text-muted-foreground">Your discussion has been posted!</p>
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
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary/50"
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
              {body.length > 0 && body.length < 10 && (
                <p className="mt-1 text-xs text-red-500">Min 10 characters ({body.length}/10)</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
              Post anonymously
            </label>

            <Button onClick={handleSubmit} disabled={submitting || !title.trim() || body.length < 10} className="w-full gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Posting..." : "Post Discussion"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
