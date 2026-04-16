import { NextResponse } from "next/server";
import { fetchTally, previousMonthWindow, sendTallyForUser } from "@/lib/tally";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint. Idempotent via the `nudges` dedupe check inside
 * sendTallyForUser — safe to hit every 5 minutes; most calls are no-ops
 * after the first successful send of the month.
 *
 * Auth: X-Cron-Secret header (same secret as calendar-poll).
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 500 });
  }
  if (req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const { start, end, label } = previousMonthWindow(now);

  const rows = await fetchTally(start, end);
  const results = [];
  let sent = 0;
  let skipped = 0;
  for (const row of rows) {
    const r = await sendTallyForUser(row, label, now);
    if (r.sent) sent++;
    else skipped++;
    results.push(r);
  }

  return NextResponse.json({
    month: label,
    window: { start: start.toISOString(), end: end.toISOString() },
    rows: rows.length,
    sent,
    skipped,
    results,
  });
}
