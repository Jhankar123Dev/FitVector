import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string; // ISO datetime
  end: string;
  isAllDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch refresh token stored during Google OAuth
    const { data: user } = await supabase
      .from("users")
      .select("google_refresh_token, google_calendar_connected")
      .eq("id", session.user.id)
      .single();

    if (!user?.google_calendar_connected || !user.google_refresh_token) {
      return Response.json(
        { error: "Google Calendar not connected", notConnected: true },
        { status: 400 },
      );
    }

    // Exchange refresh token for a short-lived access token
    const accessToken = await getAccessToken(user.google_refresh_token);

    // Fetch events for the next 30 days
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: in30Days.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });

    const calRes = await fetch(`${GOOGLE_CALENDAR_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!calRes.ok) {
      const err = await calRes.text();
      console.error("Google Calendar API error:", err);
      return Response.json(
        { error: "Failed to fetch calendar events" },
        { status: 502 },
      );
    }

    const calJson = await calRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: CalendarEvent[] = (calJson.items || []).map((item: any) => {
      const isAllDay = !!item.start?.date;
      return {
        id: item.id,
        title: item.summary || "(No title)",
        description: item.description || null,
        location: item.location || null,
        start: item.start?.dateTime ?? item.start?.date ?? "",
        end: item.end?.dateTime ?? item.end?.date ?? "",
        isAllDay,
        meetLink:
          item.conferenceData?.entryPoints?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e: any) => e.entryPointType === "video",
          )?.uri ?? null,
        htmlLink: item.htmlLink || null,
      };
    });

    return Response.json({ data: events });
  } catch (error) {
    console.error("Calendar events error:", error);
    return Response.json(
      { error: "Failed to load calendar events" },
      { status: 500 },
    );
  }
}
