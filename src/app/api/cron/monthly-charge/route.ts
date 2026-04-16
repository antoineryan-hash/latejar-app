import { NextResponse } from "next/server";
import { previousMonthWindow } from "@/lib/tally";
import {
  fetchChargeCandidates,
  chargeOneUser,
} from "@/lib/monthly-charge";

export const dynamic = "force-dynamic";

/**
 * Monthly off-session charges for Donators. Invoked alongside the
 * other cron endpoints; inner query dedupes via nudges so most ticks
 * are empty.
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
  const { start, end, label } = previousMonthWindow(now);

  const candidates = await fetchChargeCandidates(start, end, now);
  const results = [];
  let charged = 0;
  let skipped = 0;
  for (const row of candidates) {
    const r = await chargeOneUser(row, label);
    if (r.charged) charged++;
    else skipped++;
    results.push(r);
  }

  return NextResponse.json({
    month: label,
    candidates: candidates.length,
    charged,
    skipped,
    results,
  });
}
