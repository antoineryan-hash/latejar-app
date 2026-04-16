/**
 * Stripe server-side client. Returns null when STRIPE_SECRET_KEY
 * isn't set so endpoints can degrade gracefully pre-launch.
 */
import Stripe from "stripe";

let _client: Stripe | null | undefined;

export function stripeClient(): Stripe | null {
  if (_client !== undefined) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    _client = null;
    return null;
  }
  _client = new Stripe(key, {
    // Lock the API version. Bump intentionally when we want new
    // Stripe features, not implicitly on an SDK upgrade.
    apiVersion: "2026-03-25.dahlia",
    appInfo: {
      name: "Late Jar",
      url: "https://latejar.app",
    },
  });
  return _client;
}

export function publishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}

/**
 * Our Stripe Connect destination for TIACS donations. Gets set once
 * TIACS onboards to our Connect platform. Until then, Donator charges
 * are held until wired.
 */
export function charityAccountId(): string | null {
  return process.env.STRIPE_CHARITY_ACCOUNT_ID ?? null;
}

export function webhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}
