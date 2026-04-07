/**
 * Shared Google Calendar utilities used by the scheduling API routes.
 * All functions are server-side only (use createAdminClient / env vars).
 */

import { createAdminClient } from "@/lib/supabase/admin";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const GOOGLE_FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";

// ─── Token refresh ────────────────────────────────────────────────────────────

/**
 * Exchange a stored refresh token for a short-lived access token.
 * Returns null if the user hasn't connected Calendar or if the refresh token
 * has been revoked (and marks google_calendar_connected = false in that case).
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("google_refresh_token, google_calendar_connected")
    .eq("id", userId)
    .single();

  if (!user?.google_calendar_connected || !user.google_refresh_token) return null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: user.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[google-calendar] Token refresh failed for user ${userId}:`, err);
    // Revoked or invalid — mark as disconnected so the UI reflects reality
    if (res.status === 400 || res.status === 401) {
      await supabase
        .from("users")
        .update({ google_calendar_connected: false })
        .eq("id", userId);
    }
    return null;
  }

  const json = await res.json();
  return json.access_token as string;
}

// ─── Event creation ───────────────────────────────────────────────────────────

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  attendeeEmails: string[];
  addMeetLink?: boolean;
  location?: string;
}

export interface CalendarEventResult {
  eventId: string;
  meetLink: string | null;
  htmlLink: string | null;
}

/**
 * Create a Google Calendar event on the lead interviewer's primary calendar.
 * Pass addMeetLink=true to auto-attach a Google Meet conference link.
 * Throws on API failure — callers should catch and degrade gracefully.
 */
export async function createCalendarEvent(
  accessToken: string,
  input: CalendarEventInput,
): Promise<CalendarEventResult> {
  const requestId = crypto.randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    summary: input.summary,
    ...(input.description ? { description: input.description } : {}),
    ...(input.location ? { location: input.location } : {}),
    start: { dateTime: input.startDateTime, timeZone: "UTC" },
    end: { dateTime: input.endDateTime, timeZone: "UTC" },
    attendees: input.attendeeEmails.map((email) => ({ email })),
    // Send calendar invites to all attendees
    guestsCanSeeOtherGuests: true,
  };

  if (input.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  // conferenceDataVersion=1 is REQUIRED for Meet link generation to work
  const params = new URLSearchParams({ sendUpdates: "all" });
  if (input.addMeetLink) params.set("conferenceDataVersion", "1");

  const res = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar event creation failed (${res.status}): ${err}`);
  }

  const json = await res.json();

  const meetLink =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (json.conferenceData?.entryPoints as any[])?.find(
      (e) => e.entryPointType === "video",
    )?.uri ?? null;

  return {
    eventId: json.id as string,
    meetLink,
    htmlLink: (json.htmlLink as string) ?? null,
  };
}

// ─── Free / busy ──────────────────────────────────────────────────────────────

export interface FreeBusySlot {
  start: string;
  end: string;
}

export interface FreeBusyResult {
  userId: string;
  email: string;
  busy: FreeBusySlot[];
  calendarConnected: boolean;
}

/**
 * Fetch busy blocks for one user within the given time window.
 * Returns calendarConnected=false (and empty busy) if the user hasn't linked
 * their calendar or their token has been revoked.
 */
export async function getFreeBusy(
  userId: string,
  email: string,
  timeMin: string,
  timeMax: string,
): Promise<FreeBusyResult> {
  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) {
    return { userId, email, busy: [], calendarConnected: false };
  }

  const res = await fetch(GOOGLE_FREEBUSY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: email }],
    }),
  });

  if (!res.ok) {
    console.error(
      `[google-calendar] Free/busy fetch failed for ${email}: ${res.status}`,
    );
    return { userId, email, busy: [], calendarConnected: true };
  }

  const json = await res.json();
  const busy: FreeBusySlot[] =
    (json.calendars?.[email]?.busy as FreeBusySlot[]) ?? [];

  return { userId, email, busy, calendarConnected: true };
}
