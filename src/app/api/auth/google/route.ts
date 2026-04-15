import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthUrl, generateState, OAUTH_STATE_COOKIE } from "@/lib/oauth";

/**
 * GET /api/auth/google
 * Starts the OAuth flow. Sets a state cookie and redirects to Google.
 */
export async function GET() {
  const state = generateState();
  const url = buildAuthUrl(state);

  const jar = await cookies();
  jar.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 min — the flow should complete fast
  });

  return NextResponse.redirect(url);
}
