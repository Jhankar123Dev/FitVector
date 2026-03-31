import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      // Table may not exist yet — return empty list gracefully
      if (error.code === "42P01") {
        return NextResponse.json({ data: [] });
      }
      console.error("Notifications fetch error:", error);
      return NextResponse.json({ data: [] });
    }

    const notifications = (data || []).map((n) => ({
      id: n.id,
      type: n.type || "general",
      title: n.title,
      message: n.message,
      isRead: n.is_read ?? false,
      actionUrl: n.action_url || "#",
      createdAt: n.created_at,
    }));

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ data: [] });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (error && error.code !== "42P01") {
      console.error("Mark-read error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark-read error:", error);
    return NextResponse.json({ success: false });
  }
}
