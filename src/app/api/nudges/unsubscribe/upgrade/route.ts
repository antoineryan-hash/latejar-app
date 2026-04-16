import { NextResponse } from "next/server";
import { sql } from "@/db";
import { verifyUnsubToken } from "@/lib/unsubscribe-token";

export const dynamic = "force-dynamic";

// Opt-out for upgrade nudges. Sets nudge_cadence='never' (which gates
// every upgrade email). Monthly tally has its own flag, so this is a
// narrow kill-switch.
async function handle(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }
  const parsed = verifyUnsubToken(token);
  if (!parsed || parsed.kind !== "upgrade") {
    return NextResponse.json({ error: "bad_token" }, { status: 400 });
  }

  await sql`
    UPDATE users
    SET nudge_cadence = 'never'
    WHERE id = ${parsed.userId}
  `;

  if (req.method === "GET") {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:system-ui;background:#0A0A0B;color:#E8E8EA;padding:48px;max-width:480px;margin:0 auto;">
        <h1 style="color:#F5F5F7;">Got it. No more nudges.</h1>
        <p style="color:#B8B8BD;line-height:1.6;">We won&rsquo;t send you upgrade emails anymore. Monthly tallies still arrive (separate setting you can tweak in your <a href="/dashboard" style="color:#EF4444;">dashboard</a>).</p>
      </body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
