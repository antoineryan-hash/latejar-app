import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { closeSession } from "@/lib/live-session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  const { code } = await params;
  const ok = await closeSession(code.toUpperCase());
  if (!ok) return NextResponse.json({ error: "not_found_or_closed" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
