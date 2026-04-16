/**
 * Per-user aggregate stats, surfaced on /dashboard.
 */
import { sql } from "@/db";

export type UserStats = {
  minutes_this_month: number;
  sessions_this_month: number;
  minutes_lifetime: number;
};

/**
 * Current-month window in UTC. Close-enough-to-Brisbane for MVP — for
 * an Apr 16 user, April 1 UTC = March 31 14:00 Brisbane, which is off
 * by 10 hours. Acceptable until we add proper per-user tz handling.
 */
function currentMonthUtc(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return { start, end };
}

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const { start, end } = currentMonthUtc();
  const rows = await sql<
    Array<{
      minutes_this_month: number | null;
      sessions_this_month: number | null;
      minutes_lifetime: number | null;
    }>
  >`
    SELECT
      COALESCE(SUM(GREATEST(a.minutes_late, 0)) FILTER (WHERE s.scheduled_start >= ${start} AND s.scheduled_start < ${end}), 0)::int AS minutes_this_month,
      COUNT(DISTINCT a.session_id) FILTER (WHERE s.scheduled_start >= ${start} AND s.scheduled_start < ${end})::int AS sessions_this_month,
      COALESCE(SUM(GREATEST(a.minutes_late, 0)), 0)::int AS minutes_lifetime
    FROM arrivals a
    JOIN sessions s ON s.id = a.session_id
    WHERE a.user_id = ${userId}
      AND a.arrival_time IS NOT NULL
  `;
  const r = rows[0];
  return {
    minutes_this_month: r?.minutes_this_month ?? 0,
    sessions_this_month: r?.sessions_this_month ?? 0,
    minutes_lifetime: r?.minutes_lifetime ?? 0,
  };
}
