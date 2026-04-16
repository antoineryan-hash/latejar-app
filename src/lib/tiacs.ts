/**
 * TIACS fundraiser URL builder. The fundraiser is Enthuse-hosted at:
 *   https://fundraise.tiacs.org/fundraisers/upscalegoldcoastmarathon2026
 *
 * The /donate?amount=X pre-fill isn't formally documented but works in
 * practice on Enthuse pages. Worst case the amount field shows empty
 * and the user fills it in — graceful fallback by design.
 */
const BASE =
  process.env.TIACS_FUNDRAISER_URL ??
  "https://fundraise.tiacs.org/fundraisers/upscalegoldcoastmarathon2026";

export function tiacsDonationLink(dollars: number, note?: string): string {
  const u = new URL(`${BASE}/donate`);
  u.searchParams.set("amount", String(Math.max(1, Math.round(dollars))));
  if (note) u.searchParams.set("message", note);
  // utm so analytics can attribute donations that came via our email
  u.searchParams.set("utm_source", "latejar");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", "monthly_tally");
  return u.toString();
}
