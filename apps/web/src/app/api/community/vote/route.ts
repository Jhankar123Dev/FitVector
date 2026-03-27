import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const voteSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
  voteType: z.enum(["up", "down"]),
});

// ─── POST: Vote on a post/comment (toggle behavior) ─────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();
    const { targetType, targetId, voteType } = parsed.data;

    // Check existing vote
    const { data: existing } = await supabase
      .from("community_votes")
      .select("id, vote_type")
      .eq("user_id", session.user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .single();

    let action: "created" | "removed" | "switched";
    let upDelta = 0;
    let downDelta = 0;

    if (existing) {
      if (existing.vote_type === voteType) {
        // Same vote → toggle off (remove)
        await supabase.from("community_votes").delete().eq("id", existing.id);
        action = "removed";
        if (voteType === "up") upDelta = -1;
        else downDelta = -1;
      } else {
        // Different vote → switch
        await supabase.from("community_votes").update({ vote_type: voteType }).eq("id", existing.id);
        action = "switched";
        if (voteType === "up") { upDelta = 1; downDelta = -1; }
        else { upDelta = -1; downDelta = 1; }
      }
    } else {
      // New vote
      await supabase.from("community_votes").insert({
        user_id: session.user.id,
        target_type: targetType,
        target_id: targetId,
        vote_type: voteType,
      });
      action = "created";
      if (voteType === "up") upDelta = 1;
      else downDelta = 1;
    }

    // Update counts on the target post
    if (targetType === "post" && (upDelta !== 0 || downDelta !== 0)) {
      const { data: post } = await supabase
        .from("community_posts")
        .select("upvotes, downvotes")
        .eq("id", targetId)
        .single();

      if (post) {
        await supabase
          .from("community_posts")
          .update({
            upvotes: Math.max(0, (post.upvotes || 0) + upDelta),
            downvotes: Math.max(0, (post.downvotes || 0) + downDelta),
          })
          .eq("id", targetId);
      }
    }

    return NextResponse.json({
      data: { action, voteType: action === "removed" ? null : voteType },
      message: action === "removed" ? "Vote removed" : action === "switched" ? "Vote switched" : "Vote recorded",
    });
  } catch (error) {
    console.error("Vote POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
