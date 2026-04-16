/**
 * Landing-page Live Jar stats. Pulls from Postgres so numbers move the
 * moment arrivals land. Scoped to STATS_TEAM_DOMAIN (default
 * up-scale.me) so the "we eat our own cooking" story stays accurate
 * as non-UpScale sign-ups arrive.
 */
import { z } from "zod";
import { sql } from "@/db";

export const StatsSchema = z.object({
  generated_at: z.string(),
  launch_date: z.string(),
  month_total_minutes: z.number(),
  month_total_dollars: z.number(),
  lifetime_total_dollars: z.number(),
  sparkline_30d: z.array(z.number()),
  leaderboard: z.array(
    z.object({ handle: z.string(), dollars: z.number() }),
  ),
});

export type Stats = z.infer<typeof StatsSchema>;

/** Fallback rendered when the DB is unreachable or pre-launch. */
export const FALLBACK_STATS: Stats = {
  generated_at: new Date().toISOString(),
  launch_date: process.env.NEXT_PUBLIC_LAUNCH_DATE ?? "2026-05-01",
  month_total_minutes: 0,
  month_total_dollars: 0,
  lifetime_total_dollars: 0,
  sparkline_30d: new Array(30).fill(0),
  leaderboard: [],
};

const TEAM_DOMAIN = process.env.STATS_TEAM_DOMAIN ?? "up-scale.me";

export async function fetchStats(): Promise<Stats> {
  if (!process.env.DATABASE_URL) return FALLBACK_STATS;
  try {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const domainPattern = `%@${TEAM_DOMAIN}`;

    // Aggregate totals in one round-trip
    const [totals] = await sql<
      Array<{
        month_minutes: number;
        lifetime_minutes: number;
      }>
    >`
      SELECT
        COALESCE(SUM(GREATEST(a.minutes_late, 0))
                 FILTER (WHERE s.scheduled_start >= ${monthStart}), 0)::int AS month_minutes,
        COALESCE(SUM(GREATEST(a.minutes_late, 0)), 0)::int AS lifetime_minutes
      FROM arrivals a
      JOIN sessions s ON s.id = a.session_id
      JOIN users u ON u.id = a.user_id
      WHERE u.email ILIKE ${domainPattern}
        AND a.arrival_time IS NOT NULL
    `;

    // Daily buckets for the 30-day sparkline (rightmost = today)
    const daily = await sql<
      Array<{ day: string; minutes: number }>
    >`
      SELECT to_char(date_trunc('day', s.scheduled_start), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(GREATEST(a.minutes_late, 0)), 0)::int AS minutes
      FROM arrivals a
      JOIN sessions s ON s.id = a.session_id
      JOIN users u ON u.id = a.user_id
      WHERE u.email ILIKE ${domainPattern}
        AND a.arrival_time IS NOT NULL
        AND s.scheduled_start >= ${thirtyDaysAgo}
      GROUP BY 1
      ORDER BY 1
    `;
    const byDay = new Map(daily.map((d) => [d.day, d.minutes]));
    const sparkline: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      sparkline.push(byDay.get(key) ?? 0);
    }

    // Anonymised top-3 for this month. Handles are "Team Member N"
    // where N is the row order — never the user's name or email.
    const top = await sql<
      Array<{ user_id: string; minutes: number }>
    >`
      SELECT u.id::text AS user_id,
             SUM(GREATEST(a.minutes_late, 0))::int AS minutes
      FROM arrivals a
      JOIN sessions s ON s.id = a.session_id
      JOIN users u ON u.id = a.user_id
      WHERE u.email ILIKE ${domainPattern}
        AND a.arrival_time IS NOT NULL
        AND s.scheduled_start >= ${monthStart}
      GROUP BY u.id
      HAVING SUM(GREATEST(a.minutes_late, 0)) > 0
      ORDER BY SUM(GREATEST(a.minutes_late, 0)) DESC
      LIMIT 3
    `;
    const leaderboard = top.map((r, i) => ({
      handle: `Team Member ${i + 1}`,
      dollars: r.minutes,
    }));

    return {
      generated_at: now.toISOString(),
      launch_date: process.env.NEXT_PUBLIC_LAUNCH_DATE ?? "2026-05-01",
      month_total_minutes: totals?.month_minutes ?? 0,
      month_total_dollars: totals?.month_minutes ?? 0,
      lifetime_total_dollars: totals?.lifetime_minutes ?? 0,
      sparkline_30d: sparkline,
      leaderboard,
    };
  } catch {
    return FALLBACK_STATS;
  }
}

export function formatLaunchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
