/**
 * Google OAuth 2.0 helpers. Standard auth-code flow with PKCE-style state.
 *
 * Scopes requested:
 *   - openid, email, profile        — for identifying the user
 *   - calendar.events.readonly      — for reading upcoming meetings
 *
 * The `state` param is a random cookie-stored token that binds the
 * initiated flow to the callback request (CSRF protection).
 */
import { randomBytes } from "node:crypto";

export const OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events.readonly",
];

export const OAUTH_STATE_COOKIE = "latejar_oauth_state";

const AUTHZ_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export function getRedirectUri(): string {
  const base = process.env.APP_URL;
  if (!base) throw new Error("APP_URL not set");
  return `${base.replace(/\/$/, "")}/api/auth/callback`;
}

export function generateState(): string {
  return randomBytes(16).toString("base64url");
}

export function buildAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_OAUTH_CLIENT_ID not set");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: OAUTH_SCOPES.join(" "),
    state,
    access_type: "offline",   // required to get refresh_token
    prompt: "consent",        // ensures refresh_token even on re-auth
    include_granted_scopes: "true",
  });
  return `${AUTHZ_ENDPOINT}?${params.toString()}`;
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: "Bearer";
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("OAuth creds not set");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  locale?: string;
};

export async function getUserInfo(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`userinfo failed (${res.status})`);
  }
  return (await res.json()) as GoogleProfile;
}
