import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULTS = {
  email_daily_digest: true,
  email_app_status: true,
  email_followup_reminders: true,
  email_weekly_analytics: false,
  push_new_matches: true,
  push_status_updates: true,
  push_reminders: true,
};

const prefsSchema = z.object({
  email_daily_digest: z.boolean().optional(),
  email_app_status: z.boolean().optional(),
  email_followup_reminders: z.boolean().optional(),
  email_weekly_analytics: z.boolean().optional(),
  push_new_matches: z.boolean().optional(),
  push_status_updates: z.boolean().optional(),
  push_reminders: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("notification_preferences")
    .eq("id", session.user.id)
    .single();

  if (error) {
    return Response.json({ error: "Failed to load preferences" }, { status: 500 });
  }

  const prefs = { ...DEFAULTS, ...(data?.notification_preferences ?? {}) };
  return Response.json({ data: prefs });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Merge with existing prefs so a partial PUT doesn't wipe other keys
  const { data: existing } = await supabase
    .from("users")
    .select("notification_preferences")
    .eq("id", session.user.id)
    .single();

  const merged = { ...DEFAULTS, ...(existing?.notification_preferences ?? {}), ...parsed.data };

  const { error } = await supabase
    .from("users")
    .update({ notification_preferences: merged })
    .eq("id", session.user.id);

  if (error) {
    return Response.json({ error: "Failed to save preferences" }, { status: 500 });
  }

  return Response.json({ data: merged });
}
