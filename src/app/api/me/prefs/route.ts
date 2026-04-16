import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/session";

const Schema = z.object({
  nudge_cadence: z.enum(["2d", "1w", "never"]).optional(),
  monthly_tally_enabled: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { nudge_cadence, monthly_tally_enabled } = parsed.data;
  if (
    nudge_cadence === undefined &&
    monthly_tally_enabled === undefined
  ) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  await sql`
    UPDATE users
    SET nudge_cadence = COALESCE(${nudge_cadence ?? null}, nudge_cadence),
        monthly_tally_enabled = COALESCE(${monthly_tally_enabled ?? null}, monthly_tally_enabled)
    WHERE id = ${user.id}
  `;
  return NextResponse.json({ ok: true });
}
