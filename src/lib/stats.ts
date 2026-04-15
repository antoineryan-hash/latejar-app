import { z } from "zod";

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

/** Fallback rendered pre-launch and on fetch failure. */
export const FALLBACK_STATS: Stats = {
  generated_at: new Date().toISOString(),
  launch_date: process.env.NEXT_PUBLIC_LAUNCH_DATE ?? "2026-05-01",
  month_total_minutes: 0,
  month_total_dollars: 0,
  lifetime_total_dollars: 0,
  sparkline_30d: new Array(30).fill(0),
  leaderboard: [],
};

export async function fetchStats(): Promise<Stats> {
  const url = process.env.NEXT_PUBLIC_STATS_URL;
  if (!url) return FALLBACK_STATS;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return FALLBACK_STATS;
    const json = await res.json();
    return StatsSchema.parse(json);
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
