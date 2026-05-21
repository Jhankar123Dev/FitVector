import { createAdminClient } from "@/lib/supabase/admin";

// ─── Notification types (Big-5 triggers) ────────────────────────────────────
export type NotificationType =
  // Application activity
  | "application_status_changed"
  // Marketplace matches
  | "new_job_match"
  // Interview & assessment lifecycle
  | "interview_scheduled"
  | "interview_reminder"
  | "interview_cancelled"
  | "assessment_invite"
  | "assessment_scored"
  // Account / quota / security
  | "quota_warning"
  | "security_new_login"
  | "plan_updated"
  // Community
  | "community_mention"
  | "community_reply"
  | "community_upvote"
  // General fallback
  | "general";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Inserts a notification row for a user.
 *
 * Supabase Realtime will broadcast the INSERT automatically to any
 * client subscribed to the notifications channel for this user_id.
 * The frontend useNotifications hook (Sprint 2.3) listens for this
 * and invalidates the TanStack Query cache — no polling needed.
 *
 * Respects the user's notification_preferences JSONB before writing.
 * Push delivery (Sprint 2.4) and email digest (Sprint 2.5) are
 * enqueued separately — this function only handles the in-app row.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<string | null> {
  const supabase = createAdminClient();

  try {
    // Check user's in-app notification preferences
    const { data: user } = await supabase
      .from("users")
      .select("notification_preferences, status")
      .eq("id", input.userId)
      .single();

    // Skip for suspended/deleted users
    if (!user || user.status === "suspended" || user.status === "deleted") {
      return null;
    }

    // Insert into notifications table (triggers Supabase Realtime broadcast)
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        action_url: input.actionUrl ?? "#",
        is_read: false,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createNotification] Insert error:", error);
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    console.error("[createNotification] Unexpected error:", err);
    return null;
  }
}

/**
 * Batch version — inserts multiple notifications in one round-trip.
 * Use this for events that fan-out to many users (e.g. new job match sweep).
 */
export async function createNotificationsBatch(
  inputs: CreateNotificationInput[],
): Promise<void> {
  if (inputs.length === 0) return;
  const supabase = createAdminClient();

  try {
    const rows = inputs.map((input) => ({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      action_url: input.actionUrl ?? "#",
      is_read: false,
      metadata: input.metadata ?? {},
    }));

    const { error } = await supabase.from("notifications").insert(rows);
    if (error) {
      console.error("[createNotificationsBatch] Insert error:", error);
    }
  } catch (err) {
    console.error("[createNotificationsBatch] Unexpected error:", err);
  }
}

// ─── Convenience builders ────────────────────────────────────────────────────
// Use these instead of constructing raw inputs at every call site.

export const Notifications = {
  applicationStatusChanged: (
    userId: string,
    opts: { companyName: string; jobTitle: string; newStatus: string; applicationId: string },
  ): CreateNotificationInput => ({
    userId,
    type: "application_status_changed",
    title: `Application update: ${opts.companyName}`,
    message: `Your application for ${opts.jobTitle} is now ${opts.newStatus.replace(/_/g, " ")}.`,
    actionUrl: `/dashboard/tracker`,
    metadata: opts,
  }),

  newJobMatch: (
    userId: string,
    opts: { jobTitle: string; companyName: string; matchScore: number; jobId: string },
  ): CreateNotificationInput => ({
    userId,
    type: "new_job_match",
    title: `New match: ${opts.jobTitle} at ${opts.companyName}`,
    message: `${opts.matchScore}% fit — check it out before it fills.`,
    actionUrl: `/dashboard/jobs?highlight=${opts.jobId}`,
    metadata: opts,
  }),

  interviewScheduled: (
    userId: string,
    opts: { companyName: string; jobTitle: string; scheduledAt: string; interviewId: string },
  ): CreateNotificationInput => ({
    userId,
    type: "interview_scheduled",
    title: `Interview scheduled — ${opts.companyName}`,
    message: `Your interview for ${opts.jobTitle} is confirmed. Check your calendar.`,
    actionUrl: `/dashboard/interviews`,
    metadata: opts,
  }),

  assessmentInvite: (
    userId: string,
    opts: { companyName: string; jobTitle: string; assessmentId: string; expiresAt: string },
  ): CreateNotificationInput => ({
    userId,
    type: "assessment_invite",
    title: `Assessment invite — ${opts.companyName}`,
    message: `Complete your assessment for ${opts.jobTitle} before it expires.`,
    actionUrl: `/assessments/take/${opts.assessmentId}`,
    metadata: opts,
  }),

  quotaWarning: (
    userId: string,
    opts: { feature: string; used: number; limit: number },
  ): CreateNotificationInput => ({
    userId,
    type: "quota_warning",
    title: "You're close to your daily limit",
    message: `${opts.used}/${opts.limit} ${opts.feature.replace(/_/g, " ")} used today. Upgrade for more.`,
    actionUrl: `/dashboard/settings/plan`,
    metadata: opts,
  }),

  securityNewLogin: (
    userId: string,
    opts: { ip: string; userAgent: string; location?: string },
  ): CreateNotificationInput => ({
    userId,
    type: "security_new_login",
    title: "New sign-in detected",
    message: `A new login was detected${opts.location ? ` from ${opts.location}` : ""}. Not you? Secure your account.`,
    actionUrl: `/dashboard/settings/security`,
    metadata: opts,
  }),

  communityMention: (
    userId: string,
    opts: { mentionedBy: string; postId: string; postTitle: string },
  ): CreateNotificationInput => ({
    userId,
    type: "community_mention",
    title: `${opts.mentionedBy} mentioned you`,
    message: `You were mentioned in "${opts.postTitle}".`,
    actionUrl: `/community/posts/${opts.postId}`,
    metadata: opts,
  }),
};
