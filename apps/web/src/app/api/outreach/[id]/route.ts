import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("generated_outreach")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id); // scope to owner — never delete another user's record

    if (error) {
      return Response.json({ error: "Failed to delete" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete outreach error:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
