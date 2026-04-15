import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/me — current user or 401
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  return NextResponse.json({ user });
}
