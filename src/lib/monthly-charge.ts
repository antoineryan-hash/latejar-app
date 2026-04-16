/**
 * Monthly charge for Donators. Runs after the 48h heads-up has been
 * sent. Uses off-session PaymentIntents + Stripe Connect transfer to
 * the charity account.
 *
 * Dedupe: one 'monthly_charge' nudge per user per calendar-month-of-send.
 * Same pattern as the tally.
 */
import { sql } from "@/db";
import {
  stripeClient,
  charityAccountId,
} from "@/lib/stripe";

const PLATFORM_FEE_PERCENT = Number(
  process.env.LATEJAR_PLATFORM_FEE_PERCENT ?? "10",
);

export type ChargeRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  total_minutes: number;
};

export async function fetchChargeCandidates(
  monthStart: Date,
  monthEnd: Date,
  now: Date = new Date(),
): Promise<ChargeRow[]> {
  const sendMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const rows = await sql<ChargeRow[]>`
    WITH late AS (
      SELECT a.user_id,
             SUM(GREATEST(a.minutes_late, 0))::int AS total_minutes
      FROM arrivals a
      JOIN sessions s ON s.id = a.session_id
      WHERE a.arrival_time IS NOT NULL
        AND s.scheduled_start >= ${monthStart}
        AND s.scheduled_start <  ${monthEnd}
      GROUP BY a.user_id
      HAVING SUM(GREATEST(a.minutes_late, 0)) > 0
    ),
    already AS (
      SELECT DISTINCT user_id FROM nudges
      WHERE kind = 'monthly_charge'
        AND sent_at >= ${sendMonthStart}
    )
    SELECT u.id                       AS user_id,
           u.email                    AS email,
           u.display_name             AS display_name,
           u.stripe_customer_id       AS stripe_customer_id,
           u.stripe_payment_method_id AS stripe_payment_method_id,
           l.total_minutes            AS total_minutes
    FROM users u
    JOIN late l ON l.user_id = u.id
    LEFT JOIN already y ON y.user_id = u.id
    WHERE u.tier = 'donator'
      AND u.stripe_customer_id IS NOT NULL
      AND u.stripe_payment_method_id IS NOT NULL
      AND y.user_id IS NULL
  `;
  return rows;
}

export type ChargeResult = {
  user_id: string;
  charged: boolean;
  amount?: number;
  payment_intent_id?: string;
  reason?: string;
};

export async function chargeOneUser(
  row: ChargeRow,
  monthLabel: string,
): Promise<ChargeResult> {
  const stripe = stripeClient();
  if (!stripe) {
    return { user_id: row.user_id, charged: false, reason: "stripe_not_configured" };
  }
  if (!row.stripe_customer_id || !row.stripe_payment_method_id) {
    return { user_id: row.user_id, charged: false, reason: "no_card_on_file" };
  }
  const destination = charityAccountId();
  if (!destination) {
    return {
      user_id: row.user_id,
      charged: false,
      reason: "charity_account_missing",
    };
  }

  const dollars = row.total_minutes;
  const amountCents = dollars * 100; // AUD cents
  const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));

  try {
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      customer: row.stripe_customer_id,
      payment_method: row.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: `Late Jar — ${monthLabel} — ${dollars} min × $1`,
      // Connect: funds sweep to the charity's Stripe account, minus
      // our application_fee (platform fee). Charity sees a direct
      // donation from the user; we see the platform fee revenue.
      application_fee_amount: platformFeeCents,
      transfer_data: { destination },
      statement_descriptor_suffix: "LATE JAR",
      metadata: {
        latejar_user_id: row.user_id,
        month: monthLabel,
        minutes: String(row.total_minutes),
      },
    });

    // Note: nudge insert happens in the webhook on payment_intent.succeeded
    // so we don't duplicate on retry. But belt-and-braces: if the PI came
    // back immediately-succeeded, record it here as well — the unique
    // index on (user_id, sent_at, kind) dedupes by sent_at granularity.
    if (pi.status === "succeeded") {
      await sql`INSERT INTO nudges (user_id, kind) VALUES (${row.user_id}, 'monthly_charge')`;
    }

    return {
      user_id: row.user_id,
      charged: pi.status === "succeeded",
      amount: dollars,
      payment_intent_id: pi.id,
      reason: pi.status === "succeeded" ? undefined : pi.status,
    };
  } catch (err) {
    return {
      user_id: row.user_id,
      charged: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
