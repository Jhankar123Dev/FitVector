import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const commentSchema = z.object({
  body: z.string().min(1).max(5000),
  isAnonymous: z.boolean().default(false),
});

// ─── POST: Add comment (stored as child post for MVP) ────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: parentId } = await params;
    const body = await req.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const supabase = createAdminClient();

    // Verify parent post exists
    const { data: parent } = await supabase
      .from("community_posts")
      .select("id, comments_count")
      .eq("id", parentId)
      .single();

    if (!parent) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const { data: comment, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: parentId,
        user_id: session.user.id,
        body: parsed.data.body,
        is_anonymous: parsed.data.isAnonymous,
      })
      .select("id, body, is_anonymous, upvotes, created_at, users(full_name)")
      .single();

    if (commentError || !comment) {
      console.error("Comment insert error:", commentError);
      return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }

    await supabase
      .from("community_posts")
      .update({ comments_count: (parent.comments_count || 0) + 1 })
      .eq("id", parentId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = comment as any;
    return NextResponse.json({
      data: {
        id: comment.id,
        parentPostId: parentId,
        parentReplyId: null,
        authorName: parsed.data.isAnonymous ? "Anonymous" : (c.users?.full_name || "User"),
        body: comment.body,
        isAnonymous: comment.is_anonymous,
        upvotes: comment.upvotes || 0,
        userVote: null,
        createdAt: comment.created_at,
      },
      message: "Comment added",
    }, { status: 201 });
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
