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

    // For MVP: increment comments_count on parent post
    // (No separate comments table — comments stored client-side for now)
    await supabase
      .from("community_posts")
      .update({ comments_count: (parent.comments_count || 0) + 1 })
      .eq("id", parentId);

    // Log the comment (will be stored in a real comments table in future)
    console.log(`[Comment] User ${session.user.id} commented on post ${parentId}: "${parsed.data.body.slice(0, 50)}..."`);

    return NextResponse.json({
      data: {
        id: `comment-${Date.now()}`,
        parentPostId: parentId,
        authorName: parsed.data.isAnonymous ? "Anonymous" : (session.user.name || "User"),
        body: parsed.data.body,
        isAnonymous: parsed.data.isAnonymous,
        createdAt: new Date().toISOString(),
      },
      message: "Comment added",
    }, { status: 201 });
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
