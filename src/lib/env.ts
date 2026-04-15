import { z } from "zod";

/**
 * Validated server-side env. Throws at import if required vars are missing
 * in production. `.env.local` covers dev; Railway env covers prod.
 *
 * NEXT_PUBLIC_* vars are inlined at build time and accessed via
 * process.env.NEXT_PUBLIC_* directly (do not put them here).
 */
const Schema = z.object({
  // Resend
  RESEND_API_KEY: z.string().min(1),
  RESEND_AUDIENCE_ID: z.string().min(1),

  // Database
  DATABASE_URL: z.string().url().startsWith("postgres"),

  // Google OAuth
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1),

  // Token-at-rest encryption — 32 bytes base64url (43 chars)
  TOKEN_ENC_KEY: z.string().length(43),

  // Public base URL — for OAuth redirects
  APP_URL: z.string().url(),
});

const parsed = Schema.safeParse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
  DATABASE_URL: process.env.DATABASE_URL,
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  TOKEN_ENC_KEY: process.env.TOKEN_ENC_KEY,
  APP_URL: process.env.APP_URL,
});

if (!parsed.success) {
  // In dev, throw. In test, the individual modules mock this.
  if (process.env.NODE_ENV !== "test") {
    console.error("Invalid environment variables:", parsed.error.format());
    throw new Error("Missing/invalid env vars. See .env.example.");
  }
}

export const env = parsed.success
  ? parsed.data
  : (parsed as unknown as { data: z.infer<typeof Schema> }).data;
