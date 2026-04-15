import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getLiveSession } from "@/lib/live-session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const user = await getCurrentUser();
  const state = await getLiveSession(code.toUpperCase(), user?.id ?? null);
  if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(state);
}
