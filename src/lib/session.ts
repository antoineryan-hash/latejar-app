/**
 * Server-side session cookies. Opaque tokens, not JWTs.
 *
 * - Token is 32 bytes randomBytes → base64url. Stored as SHA-256 hash in DB.
 * - Cookie is httpOnly + Secure (prod) + SameSite=Lax + 30-day Max-Age.
 * - `last_used_at` refreshes on every lookup; `expires_at` rolls forward
 *   on re-auth (i.e., a fresh sign-in), not on every request.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/db";

export const SESSION_COOKIE = "latejar_session";
export const SESSION_TTL_DAYS = 30;

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000);
  await sql`
    INSERT INTO user_sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hash(token)}, ${expiresAt})
  `;
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: string;
  email: string;
  display_name: string | null;
  tier: "tracker" | "donator";
  timezone: string;
  charity_choice: string | null;
  nudge_cadence: "2d" | "1w" | "never";
  monthly_tally_enabled: boolean;
};

/** Look up the current user from the session cookie. Returns null if signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await sql<CurrentUser[]>`
    SELECT u.id, u.email, u.display_name, u.tier, u.timezone, u.charity_choice,
           u.nudge_cadence, u.monthly_tally_enabled
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hash(token)}
      AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;

  // Fire-and-forget bump last_used_at (not critical if it fails)
  sql`UPDATE user_sessions SET last_used_at = now() WHERE token_hash = ${hash(token)}`.catch(
    () => {},
  );

  return rows[0];
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM user_sessions WHERE token_hash = ${hash(token)}`;
}
