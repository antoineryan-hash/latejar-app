import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, deleteSession, clearSessionCookie } from "@/lib/session";

/**
 * POST /api/auth/logout
 * Deletes the server-side session row and clears the cookie.
 */
export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await deleteSession(token);
    } catch {
      // swallow — still clear the cookie below
    }
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
