import { sql } from "@/db";
import { minutesLate } from "./calendar";

export type Attendee = {
  user_id: string;
  display_name: string | null;
  email: string;
  tier: "tracker" | "donator";
  arrival_time: string | null; // ISO
  minutes_late: number | null;
  source: string | null;
};

export type LiveSessionState = {
  shortcode: string;
  title: string | null;
  scheduled_start: string;       // ISO
  scheduled_end: string | null;  // ISO
  closed_at: string | null;
  now: string;
  attendees: Attendee[];
  self_user_id: string | null;
};

export async function getLiveSession(
  shortcode: string,
  selfUserId: string | null,
): Promise<LiveSessionState | null> {
  const sessions = await sql<
    Array<{
      id: string;
      shortcode: string;
      title: string | null;
      scheduled_start: Date;
      scheduled_end: Date | null;
      closed_at: Date | null;
      invited_user_ids: string[];
    }>
  >`
    SELECT id, shortcode, title, scheduled_start, scheduled_end, closed_at, invited_user_ids
    FROM sessions
    WHERE shortcode = ${shortcode}
    LIMIT 1
  `;
  if (sessions.length === 0) return null;
  const s = sessions[0];

  const invitedIds: string[] = s.invited_user_ids ?? [];
  const attendees: Attendee[] = [];

  if (invitedIds.length > 0) {
    const users = await sql<
      Array<{
        id: string;
        display_name: string | null;
        email: string;
        tier: "tracker" | "donator";
      }>
    >`
      SELECT id, display_name, email, tier
      FROM users
      WHERE id = ANY(${invitedIds as unknown as string}::uuid[])
    `;

    const arrivals = await sql<
      Array<{
        user_id: string;
        arrival_time: Date | null;
        minutes_late: number | null;
        source: string | null;
      }>
    >`
      SELECT user_id, arrival_time, minutes_late, source
      FROM arrivals
      WHERE session_id = ${s.id} AND user_id = ANY(${invitedIds as unknown as string}::uuid[])
    `;
    const byUser = new Map(arrivals.map((a) => [a.user_id, a]));

    for (const u of users) {
      const a = byUser.get(u.id);
      attendees.push({
        user_id: u.id,
        display_name: u.display_name,
        email: u.email,
        tier: u.tier,
        arrival_time: a?.arrival_time ? new Date(a.arrival_time).toISOString() : null,
        minutes_late: a?.minutes_late ?? null,
        source: a?.source ?? null,
      });
    }
  }

  return {
    shortcode: s.shortcode,
    title: s.title,
    scheduled_start: s.scheduled_start.toISOString(),
    scheduled_end: s.scheduled_end?.toISOString() ?? null,
    closed_at: s.closed_at?.toISOString() ?? null,
    now: new Date().toISOString(),
    attendees,
    self_user_id: selfUserId,
  };
}

/**
 * Record a tap: user marks themselves as arrived at this session.
 * Idempotent — re-tapping preserves the original arrival_time.
 */
export async function tapArrival(
  shortcode: string,
  userId: string,
): Promise<{ arrival_time: string; minutes_late: number } | { error: string }> {
  const sessions = await sql<
    Array<{
      id: string;
      scheduled_start: Date;
      closed_at: Date | null;
      invited_user_ids: string[];
    }>
  >`
    SELECT id, scheduled_start, closed_at, invited_user_ids
    FROM sessions WHERE shortcode = ${shortcode} LIMIT 1
  `;
  if (sessions.length === 0) return { error: "not_found" };
  const s = sessions[0];
  if (s.closed_at) return { error: "session_closed" };
  if (!(s.invited_user_ids ?? []).includes(userId)) {
    return { error: "not_invited" };
  }

  const now = new Date();
  const mins = minutesLate(s.scheduled_start, now);

  // Idempotent: only insert if no existing tap arrival for this (session, user)
  const rows = await sql<
    Array<{ arrival_time: Date; minutes_late: number }>
  >`
    INSERT INTO arrivals (session_id, user_id, arrival_time, minutes_late, source)
    VALUES (${s.id}, ${userId}, ${now}, ${mins}, 'tap')
    ON CONFLICT (session_id, user_id) DO UPDATE
      SET arrival_time = LEAST(arrivals.arrival_time, EXCLUDED.arrival_time),
          minutes_late = LEAST(arrivals.minutes_late, EXCLUDED.minutes_late)
    RETURNING arrival_time, minutes_late
  `;
  return {
    arrival_time: rows[0].arrival_time.toISOString(),
    minutes_late: rows[0].minutes_late,
  };
}

export async function closeSession(shortcode: string): Promise<boolean> {
  const rows = await sql`
    UPDATE sessions
    SET closed_at = now()
    WHERE shortcode = ${shortcode} AND closed_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}
