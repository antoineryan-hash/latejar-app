import { NextResponse } from "next/server";
import { sql } from "@/db";
import { verifyUnsubToken } from "@/lib/unsubscribe-token";

export const dynamic = "force-dynamic";

// Handle both GET (regular one-click from email client) and POST (RFC 8058
// One-Click). Both do the same thing: flip monthly_tally_enabled = false.
async function handle(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }
  const parsed = verifyUnsubToken(token);
  if (!parsed || parsed.kind !== "monthly_tally") {
    return NextResponse.json({ error: "bad_token" }, { status: 400 });
  }

  await sql`
    UPDATE users
    SET monthly_tally_enabled = false
    WHERE id = ${parsed.userId}
  `;

  // Show a plain HTML confirmation for GET (clicked from email),
  // JSON for POST (automated unsub bots).
  if (req.method === "GET") {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:system-ui;background:#0A0A0B;color:#E8E8EA;padding:48px;max-width:480px;margin:0 auto;">
        <h1 style="color:#F5F5F7;">Done. You're out.</h1>
        <p style="color:#B8B8BD;line-height:1.6;">We won't send you monthly tally emails anymore. You can re-enable them any time from your <a href="/dashboard" style="color:#EF4444;">dashboard</a>.</p>
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
