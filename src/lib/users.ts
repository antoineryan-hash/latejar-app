/**
 * User upsert. Called by the OAuth callback after we've got profile +
 * refresh_token. Creates the user on first sign-in; updates refresh_token
 * + display_name + last_seen_at on subsequent sign-ins.
 */
import { sql } from "@/db";
import { encrypt } from "./crypto";
import type { GoogleProfile } from "./oauth";

export type UpsertedUser = {
  id: string;
  email: string;
  display_name: string | null;
  tier: "tracker" | "donator";
  is_new: boolean;
};

export async function upsertUserFromGoogle(
  profile: GoogleProfile,
  refreshToken: string | undefined,
): Promise<UpsertedUser> {
  // If no refresh_token came back (user previously authed and didn't hit
  // prompt=consent), we keep the existing one. This is a subtle correctness
  // concern — `prompt=consent` in our auth URL ensures we always get one.
  // For new users, we must have a refresh_token.
  const encToken = refreshToken ? encrypt(refreshToken) : null;

  const existing = await sql<
    Array<{ id: string; display_name: string | null; tier: "tracker" | "donator" }>
  >`
    SELECT id, display_name, tier FROM users WHERE google_sub = ${profile.sub} LIMIT 1
  `;

  if (existing.length > 0) {
    const row = existing[0];
    if (encToken) {
      await sql`
        UPDATE users
        SET google_refresh_token_enc = ${encToken},
            display_name = COALESCE(${profile.name ?? null}, display_name),
            last_seen_at = now()
        WHERE id = ${row.id}
      `;
    } else {
      await sql`
        UPDATE users
        SET display_name = COALESCE(${profile.name ?? null}, display_name),
            last_seen_at = now()
        WHERE id = ${row.id}
      `;
    }
    return {
      id: row.id,
      email: profile.email,
      display_name: row.display_name ?? profile.name ?? null,
      tier: row.tier,
      is_new: false,
    };
  }

  if (!encToken) {
    throw new Error("First sign-in requires a refresh_token from Google");
  }

  const inserted = await sql<Array<{ id: string }>>`
    INSERT INTO users (email, google_sub, display_name, google_refresh_token_enc)
    VALUES (${profile.email}, ${profile.sub}, ${profile.name ?? null}, ${encToken})
    RETURNING id
  `;
  return {
    id: inserted[0].id,
    email: profile.email,
    display_name: profile.name ?? null,
    tier: "tracker",
    is_new: true,
  };
}
