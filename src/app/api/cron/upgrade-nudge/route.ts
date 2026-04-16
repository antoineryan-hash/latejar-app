import { NextResponse } from "next/server";
import { fetchNudgeCandidates, sendNudgeForUser } from "@/lib/upgrade-nudge";

export const dynamic = "force-dynamic";

/**
 * Upgrade-nudge cron. Runs every tick via the Actions workflow; the
 * cadence gate is inside fetchNudgeCandidates (users only appear once
 * their cadence window has passed).
 *
 * Auth: X-Cron-Secret.
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
  const candidates = await fetchNudgeCandidates(now);
  const results = [];
  let sent = 0;
  let skipped = 0;
  for (const row of candidates) {
    const r = await sendNudgeForUser(row);
    if (r.sent) sent++;
    else skipped++;
    results.push(r);
  }

  return NextResponse.json({
    candidates: candidates.length,
    sent,
    skipped,
    results,
  });
}
