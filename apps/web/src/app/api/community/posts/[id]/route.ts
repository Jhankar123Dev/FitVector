import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET: Post detail ────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: row, error } = await supabase
      .from("community_posts")
      .select("*, users(full_name)")
      .eq("id", id)
      .single();

    if (error || !row) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Fetch comments
    const { data: commentRows } = await supabase
      .from("community_comments")
      .select("id, body, is_anonymous, upvotes, parent_comment_id, created_at, users(full_name)")
      .eq("post_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: true });

    // Batch-fetch user votes for post + comments
    const commentIds = (commentRows || []).map((c) => c.id);
    const { data: postVoteRow } = await supabase
      .from("community_votes")
      .select("vote_type")
      .eq("user_id", session.user.id)
      .eq("target_type", "post")
      .eq("target_id", id)
      .single();

    let commentVoteMap: Record<string, string> = {};
    if (commentIds.length > 0) {
      const { data: commentVoteRows } = await supabase
        .from("community_votes")
        .select("target_id, vote_type")
        .eq("user_id", session.user.id)
        .eq("target_type", "comment")
        .in("target_id", commentIds);
      commentVoteMap = Object.fromEntries(
        (commentVoteRows || []).map((v) => [v.target_id, v.vote_type])
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    const isAnon = row.is_anonymous;

    const comments = (commentRows || []).map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ca = c as any;
      return {
        id: c.id,
        threadId: id,
        parentReplyId: c.parent_comment_id ?? null,
        authorName: c.is_anonymous ? "Anonymous" : (ca.users?.full_name || "User"),
        isAnonymous: c.is_anonymous,
        body: c.body,
        upvotes: c.upvotes || 0,
        userVote: (commentVoteMap[c.id] ?? null) as "up" | "down" | null,
        createdAt: c.created_at,
      };
    });

    return NextResponse.json({
      data: {
        id: row.id,
        postType: row.post_type,
        title: row.title,
        body: row.body,
        category: row.category,
        isAnonymous: isAnon,
        authorName: isAnon ? "Anonymous" : (r.users?.full_name || "User"),
        authorId: isAnon ? null : row.user_id,
        upvotes: row.upvotes || 0,
        downvotes: row.downvotes || 0,
        commentsCount: row.comments_count || 0,
        interviewData: row.interview_data || null,
        userVote: (postVoteRow?.vote_type ?? null) as "up" | "down" | null,
        createdAt: row.created_at,
        comments,
      },
    });
  } catch (error) {
    console.error("Post detail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
