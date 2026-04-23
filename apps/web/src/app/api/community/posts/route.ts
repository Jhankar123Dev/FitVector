import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(3).max(300),
  body: z.string().min(10).max(10000),
  postType: z.enum(["interview_experience", "discussion", "salary_report"]),
  category: z.enum(["tech", "business", "design", "marketing", "career_advice", "salary", "general"]).optional(),
  isAnonymous: z.boolean().default(false),
  interviewData: z.record(z.unknown()).optional(),
});

// ─── POST: Create community post ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();
    const d = parsed.data;

    const { data: row, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: session.user.id,
        post_type: d.postType,
        title: d.title,
        body: d.body,
        category: d.category || "general",
        is_anonymous: d.isAnonymous,
        interview_data: d.interviewData || null,
        status: "published",
      })
      .select("id, post_type, title, created_at")
      .single();

    if (error || !row) {
      console.error("Post create error:", error);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    return NextResponse.json({ data: row, message: "Post created" }, { status: 201 });
  } catch (error) {
    console.error("Community POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET: List community posts ───────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

    let query = supabase
      .from("community_posts")
      .select("*, users(full_name)", { count: "exact" })
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (type) query = query.eq("post_type", type);
    if (category) query = query.eq("category", category);

    const { data: rows, error, count } = await query;

    if (error) {
      console.error("Posts fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    // Batch-fetch user votes for all returned posts
    const postIds = (rows || []).map((r) => r.id);
    let voteMap: Record<string, string> = {};
    if (postIds.length > 0) {
      const { data: userVoteRows } = await supabase
        .from("community_votes")
        .select("target_id, vote_type")
        .eq("user_id", session.user.id)
        .eq("target_type", "post")
        .in("target_id", postIds);
      voteMap = Object.fromEntries(
        (userVoteRows || []).map((v) => [v.target_id, v.vote_type])
      );
    }

    const posts = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      const isAnon = row.is_anonymous;

      return {
        id: row.id,
        postType: row.post_type,
        title: row.title,
        body: row.body,
        category: row.category,
        isAnonymous: isAnon,
        // CRITICAL: Never expose user_id for anonymous posts
        authorName: isAnon ? "Anonymous" : (r.users?.full_name || "User"),
        authorId: isAnon ? null : row.user_id,
        upvotes: row.upvotes || 0,
        downvotes: row.downvotes || 0,
        commentsCount: row.comments_count || 0,
        interviewData: row.interview_data || null,
        userVote: (voteMap[row.id] ?? null) as "up" | "down" | null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({
      data: posts,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    });
  } catch (error) {
    console.error("Community GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
