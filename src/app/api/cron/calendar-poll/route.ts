import { NextResponse } from "next/server";
import { sql } from "@/db";
import {
  refreshAccessToken,
  fetchUpcomingEvents,
  attendeeEmails,
  type CalendarEvent,
} from "@/lib/calendar";
import { upsertSession, autoCloseExpired } from "@/lib/sessions";

/**
 * POST /api/cron/calendar-poll
 *
 * Called by Railway cron every ~60 seconds. For each signed-up user with a
 * refresh token:
 *   1. Refresh access token.
 *   2. Fetch upcoming Calendar events (now-5min → now+60min).
 *   3. For each event with ≥2 Late Jar users as invitees, upsert a session row.
 *
 * Also auto-closes any sessions whose scheduled window has passed.
 *
 * Auth: `X-Cron-Secret: $CRON_SECRET` header.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds

type UserRow = {
  id: string;
  email: string;
  google_refresh_token_enc: Buffer;
};

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const users = await sql<UserRow[]>`
    SELECT id, email, google_refresh_token_enc FROM users
    ORDER BY last_seen_at DESC NULLS LAST
    LIMIT 500
  `;

  const memberEmails = new Set(users.map((u) => u.email.toLowerCase()));
  const emailToUserId = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));

  const summary = {
    users_polled: 0,
    users_failed: 0,
    events_seen: 0,
    sessions_created: 0,
    sessions_updated: 0,
    sessions_closed: 0,
    errors: [] as string[],
  };

  // Seen set to avoid touching the same session twice when two users share an event.
  const seenEventIds = new Set<string>();

  for (const u of users) {
    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(u.google_refresh_token_enc);
      summary.users_polled += 1;
    } catch (err) {
      summary.users_failed += 1;
      summary.errors.push(`refresh ${u.email}: ${(err as Error).message}`);
      continue;
    }

    let events: CalendarEvent[];
    try {
      events = await fetchUpcomingEvents(accessToken);
    } catch (err) {
      summary.errors.push(`events ${u.email}: ${(err as Error).message}`);
      continue;
    }

    for (const ev of events) {
      summary.events_seen += 1;
      if (ev.status === "cancelled") continue;
      if (seenEventIds.has(ev.id)) continue;

      const emails = attendeeEmails(ev);
      const membersAttending = emails.filter((e) => memberEmails.has(e));
      if (membersAttending.length < 2) continue;

      const startIso = ev.start.dateTime ?? ev.start.date;
      if (!startIso) continue;
      const start = new Date(startIso);
      const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : null;

      try {
        const invited_user_ids = membersAttending
          .map((email) => emailToUserId.get(email))
          .filter((id): id is string => Boolean(id));

        const res = await upsertSession({
          calendar_event_id: ev.id,
          title: ev.summary ?? null,
          scheduled_start: start,
          scheduled_end: end,
          invited_user_ids,
        });
        if (res.is_new) summary.sessions_created += 1;
        else summary.sessions_updated += 1;
        seenEventIds.add(ev.id);
      } catch (err) {
        summary.errors.push(`upsert ${ev.id}: ${(err as Error).message}`);
      }
    }
  }

  try {
    summary.sessions_closed = await autoCloseExpired();
  } catch (err) {
    summary.errors.push(`autoClose: ${(err as Error).message}`);
  }

  return NextResponse.json(summary);
}
