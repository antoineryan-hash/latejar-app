import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  getUserInfo,
  OAUTH_STATE_COOKIE,
} from "@/lib/oauth";
import { upsertUserFromGoogle } from "@/lib/users";
import { createSession, setSessionCookie } from "@/lib/session";

/**
 * GET /api/auth/callback?code=...&state=...
 *
 * Validates state, exchanges code for tokens, fetches profile,
 * upserts the user, creates a session, redirects to /dashboard.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Handle user-denied
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_params", req.url));
  }

  const jar = await cookies();
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.delete(OAUTH_STATE_COOKIE);

  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(new URL("/login?error=bad_state", req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getUserInfo(tokens.access_token);

    if (!profile.email_verified) {
      return NextResponse.redirect(new URL("/login?error=unverified_email", req.url));
    }

    const user = await upsertUserFromGoogle(profile, tokens.refresh_token);
    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    const dest = user.is_new ? "/dashboard?welcome=1" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  } catch (err) {
    console.error("[oauth callback]", err);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}
