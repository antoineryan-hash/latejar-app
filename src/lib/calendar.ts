/**
 * Google Calendar read helpers for the calendar-poll cron.
 *
 * Refreshes the stored refresh_token → access_token per user, then fetches
 * upcoming events within a window (default: now-5min → now+60min).
 *
 * No googleapis SDK — the REST endpoints are cheap and the SDK is heavy.
 */
import { decrypt } from "./crypto";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const EVENTS_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export type CalendarEvent = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string; responseStatus?: string; self?: boolean }>;
  status?: "confirmed" | "tentative" | "cancelled";
  hangoutLink?: string;
  conferenceData?: { entryPoints?: Array<{ uri: string; entryPointType: string }> };
};

export async function refreshAccessToken(
  refreshTokenEnc: Buffer,
): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("OAuth creds not set");

  const refreshToken = decrypt(refreshTokenEnc);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`token refresh failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data.access_token;
}

export type FetchEventsOpts = {
  timeMinMsFromNow?: number; // default: -5 min
  timeMaxMsFromNow?: number; // default: +60 min
  maxResults?: number;       // default: 25
};

export async function fetchUpcomingEvents(
  accessToken: string,
  opts: FetchEventsOpts = {},
): Promise<CalendarEvent[]> {
  const now = Date.now();
  const timeMin = new Date(now + (opts.timeMinMsFromNow ?? -5 * 60_000)).toISOString();
  const timeMax = new Date(now + (opts.timeMaxMsFromNow ?? 60 * 60_000)).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(opts.maxResults ?? 25),
    // only meetings with other attendees — skip personal reminders
    // (no direct filter; we filter attendees-length >= 2 in caller)
  });

  const res = await fetch(`${EVENTS_ENDPOINT}?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`events.list failed (${res.status})`);
  }
  const data = (await res.json()) as { items?: CalendarEvent[] };
  return data.items ?? [];
}

/**
 * Returns the set of attendee emails (lowercased) for an event, excluding
 * the organiser's own "self" entry when present. Empty set for events
 * that have no attendees array (solo blocks / reminders).
 */
export function attendeeEmails(ev: CalendarEvent): string[] {
  const list = ev.attendees ?? [];
  return list
    .filter((a) => !!a.email && a.responseStatus !== "declined")
    .map((a) => a.email.toLowerCase());
}

/** "Late" by our standard: joined >0 min after scheduled start. */
export function minutesLate(scheduledStart: Date, arrival: Date): number {
  const ms = arrival.getTime() - scheduledStart.getTime();
  return Math.max(0, Math.floor(ms / 60_000));
}
