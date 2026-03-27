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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    const isAnon = row.is_anonymous;

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
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error("Post detail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
