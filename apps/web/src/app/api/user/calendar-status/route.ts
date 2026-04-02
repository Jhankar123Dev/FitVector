import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("google_calendar_connected")
      .eq("id", session.user.id)
      .single();

    return Response.json({
      data: {
        googleConnected: user?.google_calendar_connected === true,
        outlookConnected: false, // Microsoft OAuth not yet configured
      },
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return Response.json({ error: "Failed to load calendar status" }, { status: 500 });
  }
}
